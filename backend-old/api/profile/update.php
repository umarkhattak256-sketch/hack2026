<?php
require_once 'C:/xampp/htdocs/donortrace/backend/config/database.php';

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
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User is required']);
    exit;
}

$userId = (int)$data['user_id'];
$bio = isset($data['bio']) ? trim($data['bio']) : '';
$sport = isset($data['sport']) ? trim($data['sport']) : 'Football';
$skill = isset($data['skill']) ? trim($data['skill']) : 'Intermediate';
$area = isset($data['area']) ? trim($data['area']) : 'Central Park';
$city = isset($data['city']) ? trim($data['city']) : '';
$lat = isset($data['lat']) && $data['lat'] !== '' ? (float)$data['lat'] : null;
$lng = isset($data['lng']) && $data['lng'] !== '' ? (float)$data['lng'] : null;
$available = !empty($data['available']) ? 1 : 0;

if ($userId <= 0 || $sport === '' || $skill === '' || $area === '') {
    echo json_encode(['success' => false, 'message' => 'Profile fields are incomplete']);
    exit;
}

$db = getDB();
ensureProfileSchema($db);

$stmt = $db->prepare("INSERT INTO sports_profiles (user_id, bio, sport, skill, area, city, lat, lng, available)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
        bio = VALUES(bio),
        sport = VALUES(sport),
        skill = VALUES(skill),
        area = VALUES(area),
        city = VALUES(city),
        lat = VALUES(lat),
        lng = VALUES(lng),
        available = VALUES(available)");
$stmt->bind_param("isssssddi", $userId, $bio, $sport, $skill, $area, $city, $lat, $lng, $available);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Profile saved']);
} else {
    echo json_encode(['success' => false, 'message' => 'Could not save profile']);
}

$db->close();
?>
