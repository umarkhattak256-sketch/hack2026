<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: PUT, OPTIONS');
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

if (!$data || !isset($data['id'])) {
    echo json_encode(['success' => false, 'message' => 'NGO ID is required']);
    exit;
}

$id = $conn->real_escape_string($data['id']);
$fields = [];

if (isset($data['name'])) $fields[] = "name = '" . $conn->real_escape_string($data['name']) . "'";
if (isset($data['description'])) $fields[] = "description = '" . $conn->real_escape_string($data['description']) . "'";
if (isset($data['country'])) $fields[] = "country = '" . $conn->real_escape_string($data['country']) . "'";
if (isset($data['website'])) $fields[] = "website = '" . $conn->real_escape_string($data['website']) . "'";
if (isset($data['email'])) $fields[] = "email = '" . $conn->real_escape_string($data['email']) . "'";
if (isset($data['phone'])) $fields[] = "phone = '" . $conn->real_escape_string($data['phone']) . "'";
if (isset($data['focus_area'])) $fields[] = "focus_area = '" . $conn->real_escape_string($data['focus_area']) . "'";

if (empty($fields)) {
    echo json_encode(['success' => false, 'message' => 'No fields to update']);
    exit;
}

$sql = "UPDATE ngos SET " . implode(', ', $fields) . " WHERE id = $id";

if ($conn->query($sql) === TRUE) {
    echo json_encode(['success' => true, 'message' => 'NGO updated successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Error updating NGO: ' . $conn->error]);
}

$conn->close();
?>
