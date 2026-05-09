<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/_schema.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
if ($userId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'user_id is required']);
    exit;
}

$db = getDB();
ensureMatchingSchema($db);

// Latest active group for this user. event_created groups are also returned so the
// MatchPage can show the resulting event card.
$stmt = $db->prepare("SELECT g.id, g.sport, g.status, g.event_id, g.for_date, g.time_window, gm.status AS my_status
    FROM `groups` g
    JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = ?
    WHERE g.for_date = CURDATE()
      AND g.status IN ('forming','ready','confirmed','event_created')
      AND gm.status IN ('matched','confirmed')
    ORDER BY g.id DESC LIMIT 1");
$stmt->bind_param("i", $userId);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    echo json_encode(['success' => true, 'group' => null]);
    exit;
}

$row = $res->fetch_assoc();
echo json_encode([
    'success' => true,
    'group' => [
        'id' => (int)$row['id'],
        'sport' => $row['sport'],
        'status' => $row['status'],
        'event_id' => $row['event_id'] !== null ? (int)$row['event_id'] : null,
        'for_date' => $row['for_date'],
        'time_window' => $row['time_window'],
        'my_status' => $row['my_status'],
    ],
]);

$db->close();
