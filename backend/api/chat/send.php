<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/_schema.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true) ?: [];
$userId = isset($data['user_id']) ? (int)$data['user_id'] : 0;
$groupId = isset($data['group_id']) ? (int)$data['group_id'] : 0;
$eventId = isset($data['event_id']) ? (int)$data['event_id'] : 0;
$body = isset($data['body']) ? trim((string)$data['body']) : '';

if ($userId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'user_id is required']);
    exit;
}
if ($groupId <= 0 && $eventId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'group_id or event_id required']);
    exit;
}
if ($body === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Message body is required']);
    exit;
}
if (mb_strlen($body) > 2000) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Message too long (max 2000 chars)']);
    exit;
}

$db = getDB();
ensureChatSchema($db);

if (!userIsChatMember($db, $userId, $groupId, $eventId)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'You are not a member of this chat']);
    exit;
}

$gid = $groupId > 0 ? $groupId : null;
$eid = $eventId > 0 ? $eventId : null;
$stmt = $db->prepare("INSERT INTO chat_messages (group_id, event_id, user_id, body) VALUES (?, ?, ?, ?)");
$stmt->bind_param("iiis", $gid, $eid, $userId, $body);

if ($stmt->execute()) {
    $messageId = $db->insert_id;
    // Return the inserted row joined to user info, so the client doesn't need a follow-up GET.
    $row = $db->prepare("SELECT cm.id, cm.group_id, cm.event_id, cm.user_id, cm.body, cm.created_at,
            u.name, sp.profile_pic_url
        FROM chat_messages cm
        JOIN users u ON u.id = cm.user_id
        LEFT JOIN sports_profiles sp ON sp.user_id = cm.user_id
        WHERE cm.id = ? LIMIT 1");
    $row->bind_param("i", $messageId);
    $row->execute();
    $r = $row->get_result()->fetch_assoc();
    echo json_encode([
        'success' => true,
        'message' => [
            'id' => (int)$r['id'],
            'group_id' => $r['group_id'] !== null ? (int)$r['group_id'] : null,
            'event_id' => $r['event_id'] !== null ? (int)$r['event_id'] : null,
            'user_id' => (int)$r['user_id'],
            'body' => $r['body'],
            'created_at' => $r['created_at'],
            'user' => [
                'id' => (int)$r['user_id'],
                'name' => $r['name'],
                'profile_pic_url' => $r['profile_pic_url'],
            ],
        ],
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Could not save message']);
}

$db->close();
