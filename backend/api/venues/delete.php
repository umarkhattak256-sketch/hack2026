<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/_schema.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$id = isset($data['id']) ? (int)$data['id'] : 0;

if ($id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Venue id is required']);
    exit;
}

$db = getDB();
ensureVenuesSchema($db);

$stmt = $db->prepare("UPDATE venues SET active = 0 WHERE id = ?");
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Venue deactivated']);
} else {
    echo json_encode(['success' => false, 'message' => 'Could not delete venue']);
}

$db->close();
