<?php
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if(!isset($data['email'], $data['password'])) {
    echo json_encode(['success' => false, 'message' => 'Email and password required']);
    exit;
}

$email = $data['email'];
$password = $data['password'];   

$db = getDB();

$stmt = $db->prepare("SELECT id, name, email, password, role FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'User not found']);
    exit;
}

$user = $result->fetch_assoc();

if(!password_verify($password, $user['password'])) {
    echo json_encode(['success' => false, 'message' => 'Wrong password']);
    exit;
}

$token = base64_encode(json_encode([
    'id' => $user['id'],
    'email' => $user['email'],
    'role' => $user['role'],
    'exp' => time() + (24 * 60 * 60)
]));

echo json_encode([
    'success' => true,
    'message' => 'Login successful',
    'token' => $token,
    'user' => [
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'role' => $user['role']
    ]
]);

$db->close();
?>
