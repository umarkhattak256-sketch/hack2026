<?php
require_once __DIR__ . '/../../config/database.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$db = getDB();

$db->query("CREATE TABLE IF NOT EXISTS availability_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    available TINYINT(1) NOT NULL,
    for_date DATE NOT NULL,
    sports JSON NULL,
    time_window VARCHAR(60) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_user_date (user_id, for_date),
    KEY idx_for_date (for_date)
)");

$json = file_get_contents('php://input');
$body = json_decode($json, true);

$userId = isset($body['user_id']) ? (int)$body['user_id'] : 0;
if ($userId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'User ID is required']);
    exit;
}

$available = isset($body['available']) && $body['available'] ? 1 : 0;
$sports = isset($body['sports']) ? json_encode($body['sports']) : null;
$timeWindow = isset($body['time_window']) ? $body['time_window'] : null;

$stmt = $db->prepare("
    INSERT INTO availability_log (user_id, available, for_date, sports, time_window)
    VALUES (?, ?, CURDATE(), ?, ?)
    ON DUPLICATE KEY UPDATE 
        available = VALUES(available),
        sports = VALUES(sports),
        time_window = VALUES(time_window)
");
$stmt->bind_param("iiss", $userId, $available, $sports, $timeWindow);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Availability updated for today']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $db->error]);
}
