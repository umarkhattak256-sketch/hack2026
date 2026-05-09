<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$conn = new mysqli('localhost', 'root', '', 'donortrace');

if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => 'Database connection failed']));
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['name']) || !isset($data['description']) || !isset($data['country'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

$name = $conn->real_escape_string($data['name']);
$description = $conn->real_escape_string($data['description']);
$country = $conn->real_escape_string($data['country']);
$website = isset($data['website']) ? $conn->real_escape_string($data['website']) : '';
$email = isset($data['email']) ? $conn->real_escape_string($data['email']) : '';
$phone = isset($data['phone']) ? $conn->real_escape_string($data['phone']) : '';
$focus_area = isset($data['focus_area']) ? $conn->real_escape_string($data['focus_area']) : '';

$sql = "INSERT INTO ngos (name, description, country, website, email, phone, focus_area) 
        VALUES ('$name', '$description', '$country', '$website', '$email', '$phone', '$focus_area')";

if ($conn->query($sql) === TRUE) {
    echo json_encode([
        'success' => true,
        'message' => 'NGO added successfully',
        'id' => $conn->insert_id
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Error adding NGO: ' . $conn->error]);
}

$conn->close();
?>


