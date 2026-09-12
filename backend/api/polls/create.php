<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../venues/_schema.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function failPollCreate($message) {
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    failPollCreate('Method not allowed');
}

$db = getDB();
ensureVenuesSchema($db);

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) {
    failPollCreate('Invalid JSON body');
}

$createdBy = isset($data['user_id']) ? (int)$data['user_id'] : (isset($data['created_by']) ? (int)$data['created_by'] : 0);
$eventId = isset($data['event_id']) && $data['event_id'] !== '' ? (int)$data['event_id'] : null;
$groupId = isset($data['group_id']) && $data['group_id'] !== '' ? (int)$data['group_id'] : null;
$venueIds = isset($data['venue_ids']) && is_array($data['venue_ids']) ? array_map('intval', $data['venue_ids']) : [];
$venueIds = array_values(array_unique(array_filter($venueIds, function ($id) {
    return $id > 0;
})));
$closesAt = isset($data['closes_at']) && $data['closes_at'] !== '' ? trim($data['closes_at']) : null;

if ($createdBy <= 0) {
    failPollCreate('User id is required');
}

if (count($venueIds) < 2 || count($venueIds) > 4) {
    failPollCreate('Pick between 2 and 4 venues');
}

if ($eventId === null && $groupId === null) {
    failPollCreate('Provide event_id or group_id');
}

$eventSport = null;
if ($eventId !== null) {
    $checkGroupId = $db->query("SHOW COLUMNS FROM events LIKE 'group_id'");
    if ($checkGroupId && $checkGroupId->num_rows === 0) {
        $db->query("ALTER TABLE events ADD COLUMN group_id INT NULL, ADD KEY idx_group_id (group_id)");
    }

    $eventStmt = $db->prepare("SELECT id, sport, group_id FROM events WHERE id = ? AND status = 'open' LIMIT 1");
    if (!$eventStmt) {
        failPollCreate('Events table is not ready');
    }
    $eventStmt->bind_param("i", $eventId);
    $eventStmt->execute();
    $eventRes = $eventStmt->get_result();
    if ($eventRes->num_rows === 0) {
        failPollCreate('Event not found');
    }
    $event = $eventRes->fetch_assoc();
    $eventSport = $event['sport'];
    if ($groupId === null && $event['group_id'] !== null) {
        $groupId = (int)$event['group_id'];
    }
}

$venueCheck = $db->prepare("SELECT id, sport FROM venues WHERE id = ? AND active = 1 LIMIT 1");
if (!$venueCheck) {
    failPollCreate('Venues table is not ready');
}

$validVenueIds = [];
foreach ($venueIds as $venueId) {
    $venueCheck->bind_param("i", $venueId);
    $venueCheck->execute();
    $venueRes = $venueCheck->get_result();
    if ($venueRes->num_rows === 0) {
        failPollCreate('One or more selected venues are not available');
    }
    $venue = $venueRes->fetch_assoc();
    if ($eventSport && strcasecmp($eventSport, 'Running') !== 0 && strcasecmp($venue['sport'], $eventSport) !== 0) {
        failPollCreate('Pick venues that match the event sport');
    }
    $validVenueIds[] = $venueId;
}

$db->begin_transaction();

try {
    if ($eventId !== null) {
        $closeStmt = $db->prepare("UPDATE venue_polls SET status = 'closed' WHERE event_id = ? AND status = 'open'");
        $closeStmt->bind_param("i", $eventId);
        $closeStmt->execute();
    } elseif ($groupId !== null) {
        $closeStmt = $db->prepare("UPDATE venue_polls SET status = 'closed' WHERE group_id = ? AND status = 'open'");
        $closeStmt->bind_param("i", $groupId);
        $closeStmt->execute();
    }

    $stmt = $db->prepare("INSERT INTO venue_polls (group_id, event_id, created_by, status, closes_at) VALUES (?, ?, ?, 'open', ?)");
    if (!$stmt) {
        throw new Exception('Could not prepare poll insert');
    }
    $stmt->bind_param("iiis", $groupId, $eventId, $createdBy, $closesAt);
    if (!$stmt->execute()) {
        throw new Exception('Could not create poll');
    }

    $pollId = $db->insert_id;
    $opt = $db->prepare("INSERT INTO venue_poll_options (poll_id, venue_id) VALUES (?, ?)");
    if (!$opt) {
        throw new Exception('Could not prepare poll options');
    }

    foreach ($validVenueIds as $venueId) {
        $opt->bind_param("ii", $pollId, $venueId);
        if (!$opt->execute()) {
            throw new Exception('Could not save poll options');
        }
    }

    $db->commit();
    echo json_encode(['success' => true, 'poll_id' => $pollId]);
} catch (Throwable $e) {
    $db->rollback();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$db->close();
?>
