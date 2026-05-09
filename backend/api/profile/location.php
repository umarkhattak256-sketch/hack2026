<?php
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

function ensureProfileLocationSchema($db) {
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

$data = json_decode(file_get_contents('php://input'), true);

$userId = isset($data['user_id']) ? (int)$data['user_id'] : 0;
$lat = isset($data['lat']) && $data['lat'] !== '' ? (float)$data['lat'] : null;
$lng = isset($data['lng']) && $data['lng'] !== '' ? (float)$data['lng'] : null;
$city = isset($data['city']) ? trim((string)$data['city']) : '';

if ($userId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'User is required']);
    exit;
}

if ($lat === null || $lng === null) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'lat and lng are required']);
    exit;
}

if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Coordinates out of range']);
    exit;
}

$db = getDB();
ensureProfileLocationSchema($db);

// Upsert: keep an existing row's other fields untouched.
$existing = $db->prepare("SELECT id FROM sports_profiles WHERE user_id = ? LIMIT 1");
$existing->bind_param("i", $userId);
$existing->execute();
$found = $existing->get_result()->num_rows > 0;

if ($found) {
    if ($city !== '') {
        $stmt = $db->prepare("UPDATE sports_profiles SET lat = ?, lng = ?, city = ? WHERE user_id = ?");
        $stmt->bind_param("ddsi", $lat, $lng, $city, $userId);
    } else {
        $stmt = $db->prepare("UPDATE sports_profiles SET lat = ?, lng = ? WHERE user_id = ?");
        $stmt->bind_param("ddi", $lat, $lng, $userId);
    }
    $ok = $stmt->execute();
} else {
    $bio = '';
    $sport = 'Football';
    $skill = 'Intermediate';
    $area = 'Central Park';
    $available = 1;
    $stmt = $db->prepare("INSERT INTO sports_profiles (user_id, bio, sport, skill, area, available, lat, lng, city)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("isssssdds", $userId, $bio, $sport, $skill, $area, $available, $lat, $lng, $city);
    $ok = $stmt->execute();
}

if ($ok) {
    echo json_encode([
        'success' => true,
        'message' => 'Location saved',
        'location' => ['lat' => $lat, 'lng' => $lng, 'city' => $city],
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Could not save location']);
}

$db->close();
