<?php
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['user_id'], $data['event_id'])) {
    echo json_encode(['success' => false, 'message' => 'User and event are required']);
    exit;
}

$userId = (int)$data['user_id'];
$eventId = (int)$data['event_id'];

if ($userId <= 0 || $eventId <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid user or event']);
    exit;
}

$db = getDB();

$db->query("CREATE TABLE IF NOT EXISTS event_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'joined',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_event_user (event_id, user_id)
)");

$eventStmt = $db->prepare("SELECT id, max_players, base_players FROM events WHERE id = ? AND status = 'open'");
$eventStmt->bind_param("i", $eventId);
$eventStmt->execute();
$eventResult = $eventStmt->get_result();

if ($eventResult->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Event not found']);
    exit;
}

$event = $eventResult->fetch_assoc();

$countStmt = $db->prepare("SELECT COUNT(*) AS total FROM event_members WHERE event_id = ? AND status = 'joined'");
$countStmt->bind_param("i", $eventId);
$countStmt->execute();
$joinedMembers = (int)$countStmt->get_result()->fetch_assoc()['total'];
$confirmed = (int)$event['base_players'] + $joinedMembers;

$alreadyStmt = $db->prepare("SELECT id FROM event_members WHERE event_id = ? AND user_id = ? LIMIT 1");
$alreadyStmt->bind_param("ii", $eventId, $userId);
$alreadyStmt->execute();
$alreadyJoined = $alreadyStmt->get_result()->num_rows > 0;

if (!$alreadyJoined && $confirmed >= (int)$event['max_players']) {
    echo json_encode(['success' => false, 'message' => 'This event is already full']);
    exit;
}

$stmt = $db->prepare("INSERT INTO event_members (event_id, user_id, status) VALUES (?, ?, 'joined') ON DUPLICATE KEY UPDATE status = 'joined'");
$stmt->bind_param("ii", $eventId, $userId);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Joined event',
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Could not join event']);
}

$db->close();
?>
