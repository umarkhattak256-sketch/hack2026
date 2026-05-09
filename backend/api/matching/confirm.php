<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/_schema.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true) ?: [];
$userId = isset($data['user_id']) ? (int)$data['user_id'] : 0;
$groupId = isset($data['group_id']) ? (int)$data['group_id'] : 0;

if ($userId <= 0 || $groupId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'user_id and group_id are required']);
    exit;
}

$db = getDB();
ensureMatchingSchema($db);

// Membership check.
$check = $db->prepare("SELECT id, status FROM group_members WHERE group_id = ? AND user_id = ? LIMIT 1");
$check->bind_param("ii", $groupId, $userId);
$check->execute();
$res = $check->get_result();
if ($res->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'You are not a member of this group']);
    exit;
}

$update = $db->prepare("UPDATE group_members SET status = 'confirmed' WHERE group_id = ? AND user_id = ?");
$update->bind_param("ii", $groupId, $userId);
$update->execute();

// Read group + counts.
$groupStmt = $db->prepare("SELECT g.id, g.sport, g.status, g.event_id,
        (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id AND gm.status IN ('matched','confirmed')) AS member_count,
        (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id AND gm.status = 'confirmed') AS confirmed_count
    FROM `groups` g WHERE g.id = ? LIMIT 1");
$groupStmt->bind_param("i", $groupId);
$groupStmt->execute();
$group = $groupStmt->get_result()->fetch_assoc();

$ruleStmt = $db->prepare("SELECT min_players, max_players FROM sport_rules WHERE sport = ? LIMIT 1");
$ruleStmt->bind_param("s", $group['sport']);
$ruleStmt->execute();
$rule = $ruleStmt->get_result()->fetch_assoc();
$minPlayers = (int)($rule['min_players'] ?? 2);

$confirmedCount = (int)$group['confirmed_count'];
$autoFinalized = false;
$eventId = $group['event_id'] ? (int)$group['event_id'] : null;

// Auto-finalize when threshold reached and group still ready.
if ($group['status'] === 'ready' && $confirmedCount >= $minPlayers) {
    // Promote to confirmed, then call finalize logic inline by invoking the script.
    $promote = $db->prepare("UPDATE `groups` SET status = 'confirmed' WHERE id = ? AND status = 'ready'");
    $promote->bind_param("i", $groupId);
    $promote->execute();

    // Fire finalize via internal HTTP-free path: include the script. But finalize.php is
    // a top-level CGI script; calling it via include here would re-emit headers. Instead,
    // just mark $autoFinalized so the caller polls /finalize.php on its next status poll.
    // We *do* perform finalize-equivalent here for snappiness:
    //
    // Side-effects mirror finalize.php (kept in sync).
    require __DIR__ . '/_finalize_logic.php';
    $finalizeResult = runFinalize($db, $groupId);
    if ($finalizeResult['success']) {
        $autoFinalized = true;
        $eventId = $finalizeResult['event_id'];
    }
}

echo json_encode([
    'success' => true,
    'group_id' => $groupId,
    'confirmed_count' => $confirmedCount,
    'min_players' => $minPlayers,
    'auto_finalized' => $autoFinalized,
    'event_id' => $eventId,
]);

$db->close();
