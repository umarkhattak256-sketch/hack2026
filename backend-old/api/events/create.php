<?php
require_once 'C:/xampp/htdocs/donortrace/backend/config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['title'], $data['sport'], $data['location'], $data['event_time'], $data['max_players'], $data['captain_name'])) {
    echo json_encode(['success' => false, 'message' => 'All event fields are required']);
    exit;
}

$title = trim($data['title']);
$sport = trim($data['sport']);
$location = trim($data['location']);
$eventTime = trim($data['event_time']);
$maxPlayers = (int)$data['max_players'];
$captainName = trim($data['captain_name']);

if ($title === '' || $sport === '' || $location === '' || $eventTime === '' || $maxPlayers < 2) {
    echo json_encode(['success' => false, 'message' => 'Event details are incomplete']);
    exit;
}

$timestamp = strtotime($eventTime);
if ($timestamp === false) {
    echo json_encode(['success' => false, 'message' => 'Invalid event time']);
    exit;
}

$db = getDB();

$db->query("CREATE TABLE IF NOT EXISTS events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    sport VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    event_time DATETIME NOT NULL,
    max_players INT NOT NULL DEFAULT 10,
    base_players INT NOT NULL DEFAULT 0,
    captain_name VARCHAR(255) NOT NULL DEFAULT 'Captain',
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$formattedTime = date('Y-m-d H:i:s', $timestamp);
$basePlayers = 1;

$stmt = $db->prepare("INSERT INTO events (title, sport, location, event_time, max_players, base_players, captain_name) VALUES (?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param("ssssiis", $title, $sport, $location, $formattedTime, $maxPlayers, $basePlayers, $captainName);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Event created',
        'event_id' => $db->insert_id,
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Could not create event']);
}

$db->close();
?>
