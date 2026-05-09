<?php
require_once 'C:/xampp/htdocs/donortrace/backend/config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
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

$db->query("CREATE TABLE IF NOT EXISTS event_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'joined',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_event_user (event_id, user_id)
)");

$seedEvents = [
    ['5v5 Football', 'Football', 'Central Park Pitch', date('Y-m-d 18:30:00'), 12, 9, 'Maya'],
    ['Evening Hoops', 'Basketball', 'Arena 12', date('Y-m-d 20:00:00'), 10, 7, 'Arman'],
    ['Doubles Tennis', 'Tennis', 'Riverside Courts', date('Y-m-d 09:00:00', strtotime('+1 day')), 4, 3, 'Sara'],
];

$seedStmt = $db->prepare("INSERT INTO events (title, sport, location, event_time, max_players, base_players, captain_name)
    SELECT ?, ?, ?, ?, ?, ?, ?
    WHERE NOT EXISTS (
        SELECT 1 FROM events WHERE title = ? AND sport = ? AND location = ? LIMIT 1
    )");

foreach ($seedEvents as $event) {
    $seedStmt->bind_param(
        "ssssiissss",
        $event[0],
        $event[1],
        $event[2],
        $event[3],
        $event[4],
        $event[5],
        $event[6],
        $event[0],
        $event[1],
        $event[2]
    );
    $seedStmt->execute();
}

$userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

$sql = "SELECT
    e.id,
    e.title,
    e.sport,
    e.location,
    e.event_time,
    e.max_players,
    e.base_players,
    e.captain_name,
    COUNT(em.id) AS joined_members,
    MAX(CASE WHEN em.user_id = ? THEN 1 ELSE 0 END) AS joined_by_user
FROM events e
LEFT JOIN event_members em ON em.event_id = e.id AND em.status = 'joined'
WHERE e.status = 'open'
AND e.id = (
    SELECT e2.id
    FROM events e2
    LEFT JOIN event_members em2 ON em2.event_id = e2.id AND em2.user_id = ?
    WHERE e2.status = 'open'
        AND e2.title = e.title
        AND e2.sport = e.sport
        AND e2.location = e.location
    ORDER BY CASE WHEN em2.id IS NULL THEN 1 ELSE 0 END, e2.id ASC
    LIMIT 1
)
GROUP BY e.id
ORDER BY e.event_time ASC";

$stmt = $db->prepare($sql);
$stmt->bind_param("ii", $userId, $userId);
$stmt->execute();
$result = $stmt->get_result();

$events = [];
while ($row = $result->fetch_assoc()) {
    $timestamp = strtotime($row['event_time']);
    $dateLabel = date('Y-m-d', $timestamp) === date('Y-m-d')
        ? 'Today'
        : (date('Y-m-d', $timestamp) === date('Y-m-d', strtotime('+1 day')) ? 'Tomorrow' : date('M j', $timestamp));

    $confirmed = (int)$row['base_players'] + (int)$row['joined_members'];
    $events[] = [
        'id' => (int)$row['id'],
        'title' => $row['title'],
        'sport' => $row['sport'],
        'time' => $dateLabel . ', ' . date('H:i', $timestamp),
        'event_time' => $row['event_time'],
        'place' => $row['location'],
        'max_players' => (int)$row['max_players'],
        'confirmed' => min($confirmed, (int)$row['max_players']),
        'captain' => $row['captain_name'],
        'joined' => (bool)$row['joined_by_user'],
    ];
}

echo json_encode([
    'success' => true,
    'events' => $events,
]);

$db->close();
?>
