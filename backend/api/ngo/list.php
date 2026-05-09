<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET');

$conn = new mysqli('localhost', 'root', '', 'donortrace');

if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => 'Database connection failed']));
}

$sql = "SELECT * FROM ngos ORDER BY created_at DESC";
$result = $conn->query($sql);

$ngos = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $ngos[] = $row;
    }
}

echo json_encode([
    'success' => true,
    'ngos' => $ngos,
    'total' => count($ngos)
]);

$conn->close();
?>
