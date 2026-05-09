<?php
require_once 'C:/xampp/htdocs/donortrace/backend/config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if(!isset($data['name'], $data['email'], $data['password'], $data['role'])) {
    echo json_encode(['success' => false, 'message' => 'All fields required']);
    exit;
}

$name = $data['name'];
$email = $data['email'];
$password = password_hash($data['password'], PASSWORD_BCRYPT);
$role = $data['role'];

if(!in_array($role, ['donor', 'ngo', 'admin'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid role']);
    exit;
}

$db = getDB();

$check = $db->prepare("SELECT id FROM users WHERE email = ?");
$check->bind_param("s", $email);
$check->execute();
$check->store_result();

if($check->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'Email already exists']);
    exit;
}

$stmt = $db->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
$stmt->bind_param("ssss", $name, $email, $password, $role);

if($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Registration successful',
        'user_id' => $db->insert_id
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Registration failed']);
}

$db->close();
?>
