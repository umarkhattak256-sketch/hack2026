<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/_schema.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$db = getDB();
ensureVenuesSchema($db);

$data = json_decode(file_get_contents('php://input'), true);

$userId = isset($data['user_id']) ? (int)$data['user_id'] : 0;
$pollId = isset($data['poll_id']) ? (int)$data['poll_id'] : 0;
$optionId = isset($data['option_id']) ? (int)$data['option_id'] : 0;

if ($userId <= 0 || $pollId <= 0 || $optionId <= 0) {
    echo json_encode(['success' => false, 'message' => 'user_id, poll_id and option_id are required']);
    exit;
}

$pollCheck = $db->prepare("SELECT status FROM venue_polls WHERE id = ? LIMIT 1");
$pollCheck->bind_param("i", $pollId);
$pollCheck->execute();
$pollRow = $pollCheck->get_result()->fetch_assoc();
if (!$pollRow) {
    echo json_encode(['success' => false, 'message' => 'Poll not found']);
    exit;
}
if ($pollRow['status'] !== 'open') {
    echo json_encode(['success' => false, 'message' => 'Poll is closed']);
    exit;
}

$optCheck = $db->prepare("SELECT id FROM venue_poll_options WHERE id = ? AND poll_id = ? LIMIT 1");
$optCheck->bind_param("ii", $optionId, $pollId);
$optCheck->execute();
if ($optCheck->get_result()->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid option for poll']);
    exit;
}

$stmt = $db->prepare("INSERT INTO venue_votes (poll_id, user_id, option_id) VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE option_id = VALUES(option_id)");
$stmt->bind_param("iii", $pollId, $userId, $optionId);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Vote saved']);
} else {
    echo json_encode(['success' => false, 'message' => 'Could not save vote']);
}

$db->close();
