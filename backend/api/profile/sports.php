<?php
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function ensureSportsSchema($db) {
    $db->query("CREATE TABLE IF NOT EXISTS user_sports (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        sport VARCHAR(60) NOT NULL,
        skill ENUM('Beginner','Intermediate','Advanced','Pro') NOT NULL DEFAULT 'Intermediate',
        is_primary TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_user_sport (user_id, sport),
        KEY idx_user (user_id),
        KEY idx_sport (sport)
    )");
}

$db = getDB();
ensureSportsSchema($db);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
    if ($userId <= 0) {
        echo json_encode(['success' => false, 'message' => 'User is required']);
        exit;
    }

    $stmt = $db->prepare("SELECT sport, skill, is_primary FROM user_sports WHERE user_id = ? ORDER BY is_primary DESC, sport ASC");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    $sports = [];
    while ($row = $result->fetch_assoc()) {
        $sports[] = ['sport' => $row['sport'], 'skill' => $row['skill'], 'is_primary' => (bool)$row['is_primary']];
    }

    echo json_encode(['success' => true, 'sports' => $sports]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['user_id'], $data['sports']) || !is_array($data['sports'])) {
    echo json_encode(['success' => false, 'message' => 'User and sports are required']);
    exit;
}

$userId = (int)$data['user_id'];
if ($userId <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid user']);
    exit;
}

$allowedSkills = ['Beginner', 'Intermediate', 'Advanced', 'Pro'];
$cleanSports = [];
$primaryFound = false;

foreach ($data['sports'] as $item) {
    $sport = isset($item['sport']) ? trim($item['sport']) : '';
    $skill = isset($item['skill']) && in_array($item['skill'], $allowedSkills) ? $item['skill'] : 'Intermediate';
    $isPrimary = !empty($item['is_primary']) ? 1 : 0;

    if ($sport === '') continue;
    if ($isPrimary && !$primaryFound) {
        $primaryFound = true;
    } else {
        $isPrimary = 0;
    }

    $cleanSports[$sport] = ['sport' => $sport, 'skill' => $skill, 'is_primary' => $isPrimary];
}

if (count($cleanSports) === 0) {
    echo json_encode(['success' => false, 'message' => 'Choose at least one sport']);
    exit;
}

if (!$primaryFound) {
    $firstKey = array_key_first($cleanSports);
    $cleanSports[$firstKey]['is_primary'] = 1;
}

$delete = $db->prepare("DELETE FROM user_sports WHERE user_id = ?");
$delete->bind_param("i", $userId);
$delete->execute();

$insert = $db->prepare("INSERT INTO user_sports (user_id, sport, skill, is_primary) VALUES (?, ?, ?, ?)");
foreach ($cleanSports as $item) {
    $insert->bind_param("issi", $userId, $item['sport'], $item['skill'], $item['is_primary']);
    $insert->execute();
}

echo json_encode(['success' => true, 'message' => 'Sports saved', 'sports' => array_values($cleanSports)]);

$db->close();
?>
