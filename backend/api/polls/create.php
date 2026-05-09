<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../venues/_schema.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$db = getDB();
ensureVenuesSchema($db);

$data = json_decode(file_get_contents('php://input'), true);

$createdBy = isset($data['user_id']) ? (int)$data['user_id'] : (isset($data['created_by']) ? (int)$data['created_by'] : 0);
$eventId = isset($data['event_id']) && $data['event_id'] !== '' ? (int)$data['event_id'] : null;
$groupId = isset($data['group_id']) && $data['group_id'] !== '' ? (int)$data['group_id'] : null;
$venueIds = isset($data['venue_ids']) && is_array($data['venue_ids']) ? array_map('intval', $data['venue_ids']) : [];
$closesAt = isset($data['closes_at']) && $data['closes_at'] !== '' ? trim($data['closes_at']) : null;

if ($createdBy <= 0) {
    echo json_encode(['success' => false, 'message' => 'User id is required']);
    exit;
}

if (count($venueIds) < 2 || count($venueIds) > 4) {
    echo json_encode(['success' => false, 'message' => 'Pick between 2 and 4 venues']);
    exit;
}

if ($eventId === null && $groupId === null) {
    echo json_encode(['success' => false, 'message' => 'Provide event_id or group_id']);
    exit;
}

if ($eventId !== null) {
    $check = $db->prepare("SELECT id FROM venue_polls WHERE event_id = ? AND status = 'open' LIMIT 1");
    $check->bind_param("i", $eventId);
    $check->execute();
    $existing = $check->get_result();
    while ($row = $existing->fetch_assoc()) {
        $closeStmt = $db->prepare("UPDATE venue_polls SET status = 'closed' WHERE id = ?");
        $closeId = (int)$row['id'];
        $closeStmt->bind_param("i", $closeId);
        $closeStmt->execute();
    }
}

$stmt = $db->prepare("INSERT INTO venue_polls (group_id, event_id, created_by, status, closes_at) VALUES (?, ?, ?, 'open', ?)");
$stmt->bind_param("iiis", $groupId, $eventId, $createdBy, $closesAt);

if (!$stmt->execute()) {
    echo json_encode(['success' => false, 'message' => 'Could not create poll']);
    exit;
}

$pollId = $db->insert_id;

$opt = $db->prepare("INSERT INTO venue_poll_options (poll_id, venue_id) VALUES (?, ?)");
foreach ($venueIds as $venueId) {
    $opt->bind_param("ii", $pollId, $venueId);
    $opt->execute();
}

echo json_encode(['success' => true, 'poll_id' => $pollId]);
$db->close();
