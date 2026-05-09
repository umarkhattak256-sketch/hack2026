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
$check = $db->prepare("SELECT id FROM group_members WHERE group_id = ? AND user_id = ? LIMIT 1");
$check->bind_param("ii", $groupId, $userId);
$check->execute();
if ($check->get_result()->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'You are not a member of this group']);
    exit;
}

$update = $db->prepare("UPDATE group_members SET status = 'declined' WHERE group_id = ? AND user_id = ?");
$update->bind_param("ii", $groupId, $userId);
$update->execute();

// Read sport + active member count for backfill decisions.
$infoStmt = $db->prepare("SELECT g.sport, g.status, g.captain_user_id, g.for_date, g.time_window,
        (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id AND gm.status IN ('matched','confirmed')) AS active_count,
        (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id AND gm.status = 'confirmed') AS confirmed_count
    FROM `groups` g WHERE g.id = ? LIMIT 1");
$infoStmt->bind_param("i", $groupId);
$infoStmt->execute();
$group = $infoStmt->get_result()->fetch_assoc();
if (!$group) {
    echo json_encode(['success' => false, 'message' => 'Group not found']);
    exit;
}

$ruleStmt = $db->prepare("SELECT min_players, max_players FROM sport_rules WHERE sport = ? LIMIT 1");
$ruleStmt->bind_param("s", $group['sport']);
$ruleStmt->execute();
$rule = $ruleStmt->get_result()->fetch_assoc();
$minPlayers = (int)($rule['min_players'] ?? 2);
$maxPlayers = (int)($rule['max_players'] ?? 14);

$activeCount = (int)$group['active_count'];

// Cancel the group entirely if the captain bailed (active_count includes them only if
// status was matched/confirmed — they just got marked declined here, so this catches
// the case where the captain was the user_id we just touched).
$captainGone = (int)$group['captain_user_id'] === $userId;
$cancelled = false;
$revertedToForming = false;

if ($captainGone || $activeCount < $minPlayers) {
    if ($activeCount === 0) {
        // Empty group — cancel it.
        $cancel = $db->prepare("UPDATE `groups` SET status = 'cancelled' WHERE id = ?");
        $cancel->bind_param("i", $groupId);
        $cancel->execute();
        $cancelled = true;
    } else {
        // Drop back to 'forming' so /run.php can backfill on next call.
        $revert = $db->prepare("UPDATE `groups` SET status = 'forming' WHERE id = ?");
        $revert->bind_param("i", $groupId);
        $revert->execute();
        $revertedToForming = true;

        // Re-pick captain if the captain bailed.
        if ($captainGone) {
            $newCaptStmt = $db->prepare("SELECT user_id FROM group_members WHERE group_id = ? AND status IN ('matched','confirmed') ORDER BY RAND() LIMIT 1");
            $newCaptStmt->bind_param("i", $groupId);
            $newCaptStmt->execute();
            $r = $newCaptStmt->get_result();
            if ($r->num_rows > 0) {
                $newCapt = (int)$r->fetch_assoc()['user_id'];
                $u = $db->prepare("UPDATE `groups` SET captain_user_id = ? WHERE id = ?");
                $u->bind_param("ii", $newCapt, $groupId);
                $u->execute();
            }
        }
    }
}

echo json_encode([
    'success' => true,
    'group_id' => $groupId,
    'active_count' => $activeCount,
    'min_players' => $minPlayers,
    'cancelled' => $cancelled,
    'reverted_to_forming' => $revertedToForming,
]);

$db->close();
