<?php
require_once 'C:/xampp/htdocs/donortrace/backend/config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function ensureProfilePictureSchema($db) {
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

    $check = $db->query("SHOW COLUMNS FROM sports_profiles LIKE 'profile_pic_url'");
    if ($check && $check->num_rows === 0) {
        $db->query("ALTER TABLE sports_profiles ADD COLUMN profile_pic_url VARCHAR(500) NULL");
    }
}

$userId = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;

if ($userId <= 0 || !isset($_FILES['profile_picture'])) {
    echo json_encode(['success' => false, 'message' => 'User and image are required']);
    exit;
}

$file = $_FILES['profile_picture'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'Upload failed']);
    exit;
}

if ($file['size'] > 5 * 1024 * 1024) {
    echo json_encode(['success' => false, 'message' => 'Image must be 5 MB or smaller']);
    exit;
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']);
$extensions = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
];

if (!isset($extensions[$mime])) {
    echo json_encode(['success' => false, 'message' => 'Only JPG, PNG, or WEBP images are allowed']);
    exit;
}

$uploadDir = 'C:/xampp/htdocs/donortrace/backend/uploads/users/' . $userId;
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$fileName = bin2hex(random_bytes(16)) . '.' . $extensions[$mime];
$targetPath = $uploadDir . '/' . $fileName;

if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    echo json_encode(['success' => false, 'message' => 'Could not save image']);
    exit;
}

$url = '/uploads/users/' . $userId . '/' . $fileName;

$db = getDB();
ensureProfilePictureSchema($db);

$stmt = $db->prepare("INSERT INTO sports_profiles (user_id, profile_pic_url) VALUES (?, ?)
    ON DUPLICATE KEY UPDATE profile_pic_url = VALUES(profile_pic_url)");
$stmt->bind_param("is", $userId, $url);
$stmt->execute();

echo json_encode([
    'success' => true,
    'message' => 'Profile picture uploaded',
    'url' => $url,
]);

$db->close();
?>
