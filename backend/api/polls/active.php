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

$checkGroupId = $db->query("SHOW COLUMNS FROM events LIKE 'group_id'");
if ($checkGroupId && $checkGroupId->num_rows === 0) {
    $db->query("ALTER TABLE events ADD COLUMN group_id INT NULL, ADD KEY idx_group_id (group_id)");
}

$db->query("CREATE TABLE IF NOT EXISTS group_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    status ENUM('matched','confirmed','declined','removed') DEFAULT 'matched',
    fit_score DECIMAL(5,2) NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_group_user (group_id, user_id),
    KEY idx_group (group_id),
    KEY idx_user (user_id)
)");

$userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

if ($userId <= 0) {
    echo json_encode(['success' => false, 'message' => 'user_id required']);
    exit;
}

$stmt = $db->prepare("SELECT DISTINCT vp.id, vp.event_id, vp.created_at
    FROM venue_polls vp
    LEFT JOIN events e ON e.id = vp.event_id
    LEFT JOIN event_members em ON em.event_id = vp.event_id
        AND em.user_id = ?
        AND em.status = 'joined'
    LEFT JOIN group_members gm ON gm.group_id = vp.group_id
        AND gm.user_id = ?
        AND gm.status IN ('matched', 'confirmed')
    LEFT JOIN group_members egm ON egm.group_id = e.group_id
        AND egm.user_id = ?
        AND egm.status IN ('matched', 'confirmed')
    WHERE vp.status = 'open'
        AND (em.id IS NOT NULL OR gm.id IS NOT NULL OR egm.id IS NOT NULL)
    ORDER BY vp.created_at DESC LIMIT 1");
$stmt->bind_param("iii", $userId, $userId, $userId);
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
