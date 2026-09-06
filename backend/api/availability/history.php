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

$userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
if ($userId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'User ID is required']);
    exit;
}

$days = isset($_GET['days']) ? (int)$_GET['days'] : 14;

$stmt = $db->prepare("
    SELECT available, for_date, sports, time_window 
    FROM availability_log 
    WHERE user_id = ? AND for_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    ORDER BY for_date DESC
");
$stmt->bind_param("ii", $userId, $days);
$stmt->execute();
$result = $stmt->get_result();

$history = [];
while ($row = $result->fetch_assoc()) {
    if (isset($row['sports']) && $row['sports'] !== null) {
        $row['sports'] = json_decode($row['sports'], true);
    }
    $row['available'] = (bool)$row['available'];
    $history[] = $row;
}

echo json_encode(['success' => true, 'data' => $history]);
