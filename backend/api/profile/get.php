<?php
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function ensureProfileSchema($db) {
    $db->query("CREATE TABLE IF NOT EXISTS sports_profiles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL UNIQUE,
        bio TEXT,
        sport VARCHAR(100) NOT NULL DEFAULT 'Football',
        skill VARCHAR(100) NOT NULL DEFAULT 'Intermediate',
        area VARCHAR(255) NOT NULL DEFAULT 'Central Park',
        available TINYINT(1) NOT NULL DEFAULT 1,
        profile_pic_url VARCHAR(500) NULL,
        lat DECIMAL(10,7) NULL,
        lng DECIMAL(10,7) NULL,
        city VARCHAR(120) NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $columns = ['profile_pic_url' => 'VARCHAR(500) NULL', 'lat' => 'DECIMAL(10,7) NULL', 'lng' => 'DECIMAL(10,7) NULL', 'city' => 'VARCHAR(120) NULL'];
    foreach ($columns as $column => $definition) {
        $check = $db->query("SHOW COLUMNS FROM sports_profiles LIKE '$column'");
        if ($check && $check->num_rows === 0) {
            $db->query("ALTER TABLE sports_profiles ADD COLUMN $column $definition");
        }
    }

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

$userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

if ($userId <= 0) {
    echo json_encode(['success' => false, 'message' => 'User is required']);
    exit;
}

$db = getDB();
ensureProfileSchema($db);

$stmt = $db->prepare("SELECT bio, sport, skill, area, available, profile_pic_url, lat, lng, city FROM sports_profiles WHERE user_id = ? LIMIT 1");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

$profile = [
    'bio' => 'Busy student, free most evenings, prefers friendly competitive games.',
    'sport' => 'Football',
    'skill' => 'Intermediate',
    'area' => 'Central Park',
    'available' => true,
    'profile_pic_url' => null,
    'lat' => null,
    'lng' => null,
    'city' => '',
];

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $profile = [
        'bio' => $row['bio'],
        'sport' => $row['sport'],
        'skill' => $row['skill'],
        'area' => $row['area'],
        'available' => (bool)$row['available'],
        'profile_pic_url' => $row['profile_pic_url'],
        'lat' => $row['lat'],
        'lng' => $row['lng'],
        'city' => $row['city'],
    ];
}

$sportsStmt = $db->prepare("SELECT sport, skill, is_primary FROM user_sports WHERE user_id = ? ORDER BY is_primary DESC, sport ASC");
$sportsStmt->bind_param("i", $userId);
$sportsStmt->execute();
$sportsResult = $sportsStmt->get_result();

$sports = [];
while ($sport = $sportsResult->fetch_assoc()) {
    $sports[] = [
        'sport' => $sport['sport'],
        'skill' => $sport['skill'],
        'is_primary' => (bool)$sport['is_primary'],
    ];
}

if (count($sports) === 0) {
    $sports[] = [
        'sport' => $profile['sport'],
        'skill' => $profile['skill'],
        'is_primary' => true,
    ];
}

echo json_encode([
    'success' => true,
    'profile' => $profile,
    'sports' => $sports,
]);

$db->close();
?>
