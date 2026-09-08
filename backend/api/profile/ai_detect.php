<?php
require_once __DIR__ . '/../../config/database.php';

// AI / Smart Enhancements — "Identify sports/interests from profile
// description" (rubric: up to 500p).
//
// Takes free-text bio, asks an LLM (via Groq) to pull out which of the
// app's supported sports the user is talking about and how skilled they
// sound, and returns structured suggestions the frontend can offer as
// one-tap "Add this sport" chips. This never writes to the database
// itself — /api/profile/sports.php (already built) still owns saving.

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'POST required']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$bio = trim($input['bio'] ?? '');
$userId = isset($input['user_id']) ? (int)$input['user_id'] : 0;

if ($bio === '') {
    echo json_encode(['success' => false, 'message' => 'bio text is required']);
    exit;
}

if (mb_strlen($bio) > 2000) {
    $bio = mb_substr($bio, 0, 2000);
}

if (!defined('GROQ_API_KEY') || GROQ_API_KEY === '') {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'AI detection is not configured (missing GROQ_API_KEY).']);
    exit;
}

// The exact list of sports the rest of the app actually supports
// (must match matching/_schema.php's sport_rules seed list) — the model
// is instructed to only choose from this list so results always map
// cleanly onto real matching/group logic.
$allowedSports = ['Football', 'Basketball', 'Tennis', 'Volleyball', 'Padel', 'Running'];
$allowedSkills = ['Beginner', 'Intermediate', 'Advanced', 'Pro'];

$systemPrompt = "You are a sports-profile parser for the ShowUp2Move app. "
    . "Read the user's short bio and identify which sports they play or are "
    . "interested in, and estimate their skill level for each from context clues "
    . "(word choice like 'beginner', 'years of experience', 'competitive', 'casual', etc). "
    . "Only choose sports from this exact list: " . implode(', ', $allowedSports) . ". "
    . "Only choose skill from this exact list: " . implode(', ', $allowedSkills) . ". "
    . "If the bio mentions a sport not in the list, ignore it. "
    . "If skill is unclear, default to Intermediate. "
    . "Respond ONLY with strict JSON, no prose, no markdown fences, in exactly this shape: "
    . '{"suggestions":[{"sport":"Football","skill":"Advanced","confidence":0.9}]}. '
    . "confidence is your own 0-1 estimate of how sure you are the person actually plays this sport. "
    . "If no sport is confidently identifiable, return {\"suggestions\":[]}.";

$payload = [
    'model' => GROQ_MODEL,
    'temperature' => 0.2,
    'max_tokens' => 400,
    'response_format' => ['type' => 'json_object'],
    'messages' => [
        ['role' => 'system', 'content' => $systemPrompt],
        ['role' => 'user', 'content' => $bio],
    ],
];

$ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . GROQ_API_KEY,
    ],
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_TIMEOUT => 15,
]);
$response = curl_exec($ch);
$curlError = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response === false) {
    http_response_code(502);
    echo json_encode(['success' => false, 'message' => 'Could not reach AI service: ' . $curlError]);
    exit;
}

if ($httpCode < 200 || $httpCode >= 300) {
    http_response_code(502);
    echo json_encode(['success' => false, 'message' => 'AI service returned an error', 'http_code' => $httpCode, 'raw' => $response]);
    exit;
}

$data = json_decode($response, true);
$content = $data['choices'][0]['message']['content'] ?? null;

if (!$content) {
    http_response_code(502);
    echo json_encode(['success' => false, 'message' => 'AI response was empty or malformed']);
    exit;
}

$parsed = json_decode($content, true);
$rawSuggestions = $parsed['suggestions'] ?? [];

// Defensive re-validation: never trust the model's output blindly. Drop
// anything outside our allowed lists instead of letting bad data reach
// the frontend (or worse, get saved as a sport that breaks matching).
$clean = [];
foreach ($rawSuggestions as $s) {
    $sport = $s['sport'] ?? null;
    $skill = $s['skill'] ?? 'Intermediate';
    $confidence = isset($s['confidence']) ? (float)$s['confidence'] : 0.5;

    if (!in_array($sport, $allowedSports, true)) continue;
    if (!in_array($skill, $allowedSkills, true)) $skill = 'Intermediate';
    $confidence = max(0.0, min(1.0, $confidence));

    $clean[] = [
        'sport' => $sport,
        'skill' => $skill,
        'confidence' => round($confidence, 2),
    ];
}

echo json_encode([
    'success' => true,
    'suggestions' => $clean,
]);
