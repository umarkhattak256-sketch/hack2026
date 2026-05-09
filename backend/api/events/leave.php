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

$stmt = $db->prepare("UPDATE event_members SET status = 'cancelled' WHERE event_id = ? AND user_id = ?");
$stmt->bind_param("ii", $eventId, $userId);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Left event']);
} else {
    echo json_encode(['success' => false, 'message' => 'Could not leave event']);
}

$db->close();
?>
