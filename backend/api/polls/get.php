<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../venues/_schema.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$db = getDB();
ensureVenuesSchema($db);

$pollId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$eventId = isset($_GET['event_id']) ? (int)$_GET['event_id'] : 0;
$userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

if ($pollId <= 0 && $eventId <= 0) {
    echo json_encode(['success' => false, 'message' => 'Provide poll id or event_id']);
    exit;
}

if ($pollId <= 0 && $eventId > 0) {
    $resolve = $db->prepare("SELECT id FROM venue_polls WHERE event_id = ? AND status = 'open' ORDER BY id DESC LIMIT 1");
    $resolve->bind_param("i", $eventId);
    $resolve->execute();
    $resolveRes = $resolve->get_result();
    if ($resolveRes->num_rows === 0) {
        echo json_encode(['success' => true, 'poll' => null]);
        exit;
    }
    $pollId = (int)$resolveRes->fetch_assoc()['id'];
}

$pollStmt = $db->prepare("SELECT id, group_id, event_id, created_by, status, closes_at, created_at FROM venue_polls WHERE id = ? LIMIT 1");
$pollStmt->bind_param("i", $pollId);
$pollStmt->execute();
$pollRes = $pollStmt->get_result();
if ($pollRes->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Poll not found']);
    exit;
}
$poll = $pollRes->fetch_assoc();

$optStmt = $db->prepare("SELECT vpo.id AS option_id, v.id AS venue_id, v.name, v.sport, v.address, v.city, v.lat, v.lng, v.price_per_hour, v.currency, v.features
    FROM venue_poll_options vpo
    JOIN venues v ON v.id = vpo.venue_id
    WHERE vpo.poll_id = ?");
$optStmt->bind_param("i", $pollId);
$optStmt->execute();
$optRes = $optStmt->get_result();

$options = [];
while ($row = $optRes->fetch_assoc()) {
    $features = $row['features'] ? json_decode($row['features'], true) : [];
    $options[(int)$row['option_id']] = [
        'option_id' => (int)$row['option_id'],
        'venue_id' => (int)$row['venue_id'],
        'name' => $row['name'],
        'sport' => $row['sport'],
        'address' => $row['address'],
        'city' => $row['city'],
        'lat' => $row['lat'] !== null ? (float)$row['lat'] : null,
        'lng' => $row['lng'] !== null ? (float)$row['lng'] : null,
        'price_per_hour' => $row['price_per_hour'] !== null ? (float)$row['price_per_hour'] : null,
        'currency' => $row['currency'],
        'features' => is_array($features) ? $features : [],
        'votes' => 0,
    ];
}

$tallyStmt = $db->prepare("SELECT option_id, COUNT(*) AS total FROM venue_votes WHERE poll_id = ? GROUP BY option_id");
$tallyStmt->bind_param("i", $pollId);
$tallyStmt->execute();
$tallyRes = $tallyStmt->get_result();
$totalVotes = 0;
while ($row = $tallyRes->fetch_assoc()) {
    if (isset($options[(int)$row['option_id']])) {
        $options[(int)$row['option_id']]['votes'] = (int)$row['total'];
        $totalVotes += (int)$row['total'];
    }
}

$myVoteOption = null;
if ($userId > 0) {
    $voteStmt = $db->prepare("SELECT option_id FROM venue_votes WHERE poll_id = ? AND user_id = ? LIMIT 1");
    $voteStmt->bind_param("ii", $pollId, $userId);
    $voteStmt->execute();
    $voteRes = $voteStmt->get_result();
    if ($voteRes->num_rows > 0) {
        $myVoteOption = (int)$voteRes->fetch_assoc()['option_id'];
    }
}

echo json_encode([
    'success' => true,
    'poll' => [
        'id' => (int)$poll['id'],
        'event_id' => $poll['event_id'] !== null ? (int)$poll['event_id'] : null,
        'group_id' => $poll['group_id'] !== null ? (int)$poll['group_id'] : null,
        'created_by' => (int)$poll['created_by'],
        'status' => $poll['status'],
        'closes_at' => $poll['closes_at'],
        'created_at' => $poll['created_at'],
        'total_votes' => $totalVotes,
        'my_vote_option' => $myVoteOption,
        'options' => array_values($options),
    ],
]);

$db->close();
