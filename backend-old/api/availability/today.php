<?php
require_once __DIR__ . '/../../config/database.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$db = getDB();

// Fast-path to ensure the schema allows us to operate
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

$userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
if ($userId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'User ID is required']);
    exit;
}

$stmt = $db->prepare("SELECT available, for_date, sports, time_window FROM availability_log WHERE user_id = ? AND for_date = CURDATE()");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    if (isset($row['sports']) && $row['sports'] !== null) {
        $row['sports'] = json_decode($row['sports'], true);
    }
    $row['available'] = (bool)$row['available'];
    echo json_encode(['success' => true, 'data' => $row]);
} else {
    echo json_encode(['success' => true, 'data' => null]);
}
