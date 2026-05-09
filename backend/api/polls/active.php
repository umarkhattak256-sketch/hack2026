<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../venues/_schema.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$db = getDB();
ensureVenuesSchema($db);

$db->query("CREATE TABLE IF NOT EXISTS event_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'joined',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_event_user (event_id, user_id)
)");

$userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

if ($userId <= 0) {
    echo json_encode(['success' => false, 'message' => 'user_id required']);
    exit;
}

$stmt = $db->prepare("SELECT vp.id, vp.event_id, vp.created_at
    FROM venue_polls vp
    JOIN event_members em ON em.event_id = vp.event_id AND em.status = 'joined'
    WHERE em.user_id = ? AND vp.status = 'open'
    ORDER BY vp.created_at DESC LIMIT 1");
$stmt->bind_param("i", $userId);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    echo json_encode(['success' => true, 'poll' => null]);
    exit;
}

$row = $res->fetch_assoc();
echo json_encode([
    'success' => true,
    'poll' => [
        'id' => (int)$row['id'],
        'event_id' => $row['event_id'] !== null ? (int)$row['event_id'] : null,
    ],
]);

$db->close();
