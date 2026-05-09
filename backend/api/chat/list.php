<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/_schema.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
$groupId = isset($_GET['group_id']) ? (int)$_GET['group_id'] : 0;
$eventId = isset($_GET['event_id']) ? (int)$_GET['event_id'] : 0;
$sinceId = isset($_GET['since_id']) ? (int)$_GET['since_id'] : 0;
$limit = isset($_GET['limit']) ? max(1, min(200, (int)$_GET['limit'])) : 100;

if ($groupId <= 0 && $eventId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'group_id or event_id required']);
    exit;
}

$db = getDB();
ensureChatSchema($db);

// If a user_id is supplied, verify membership. We don't *require* user_id on this
// endpoint to keep things flexible during the prototype, but if they pass one we
// honor it as an authorization check.
if ($userId > 0 && !userIsChatMember($db, $userId, $groupId, $eventId)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'You are not a member of this chat']);
    exit;
}

if ($groupId > 0) {
    $sql = "SELECT cm.id, cm.group_id, cm.event_id, cm.user_id, cm.body, cm.created_at,
            u.name, sp.profile_pic_url
        FROM chat_messages cm
        JOIN users u ON u.id = cm.user_id
        LEFT JOIN sports_profiles sp ON sp.user_id = cm.user_id
        WHERE cm.group_id = ? AND cm.id > ?
        ORDER BY cm.id ASC LIMIT $limit";
    $stmt = $db->prepare($sql);
    $stmt->bind_param("ii", $groupId, $sinceId);
} else {
    $sql = "SELECT cm.id, cm.group_id, cm.event_id, cm.user_id, cm.body, cm.created_at,
            u.name, sp.profile_pic_url
        FROM chat_messages cm
        JOIN users u ON u.id = cm.user_id
        LEFT JOIN sports_profiles sp ON sp.user_id = cm.user_id
        WHERE cm.event_id = ? AND cm.id > ?
        ORDER BY cm.id ASC LIMIT $limit";
    $stmt = $db->prepare($sql);
    $stmt->bind_param("ii", $eventId, $sinceId);
}

$stmt->execute();
$res = $stmt->get_result();

$messages = [];
$lastId = $sinceId;
while ($row = $res->fetch_assoc()) {
    $id = (int)$row['id'];
    if ($id > $lastId) $lastId = $id;
    $messages[] = [
        'id' => $id,
        'group_id' => $row['group_id'] !== null ? (int)$row['group_id'] : null,
        'event_id' => $row['event_id'] !== null ? (int)$row['event_id'] : null,
        'user_id' => (int)$row['user_id'],
        'body' => $row['body'],
        'created_at' => $row['created_at'],
        'user' => [
            'id' => (int)$row['user_id'],
            'name' => $row['name'],
            'profile_pic_url' => $row['profile_pic_url'],
        ],
    ];
}

echo json_encode([
    'success' => true,
    'messages' => $messages,
    'last_id' => $lastId,
    'count' => count($messages),
]);

$db->close();
