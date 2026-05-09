<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/_schema.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$db = getDB();
ensureVenuesSchema($db);

$data = json_decode(file_get_contents('php://input'), true);

$name = isset($data['name']) ? trim($data['name']) : '';
$sport = isset($data['sport']) ? trim($data['sport']) : '';
$address = isset($data['address']) ? trim($data['address']) : null;
$city = isset($data['city']) ? trim($data['city']) : null;
$lat = isset($data['lat']) && $data['lat'] !== '' ? (float)$data['lat'] : null;
$lng = isset($data['lng']) && $data['lng'] !== '' ? (float)$data['lng'] : null;
$price = isset($data['price_per_hour']) && $data['price_per_hour'] !== '' ? (float)$data['price_per_hour'] : null;
$currency = isset($data['currency']) && $data['currency'] !== '' ? trim($data['currency']) : 'EUR';
$features = isset($data['features']) && is_array($data['features']) ? json_encode($data['features']) : null;
$active = isset($data['active']) ? ($data['active'] ? 1 : 0) : 1;

if ($name === '' || $sport === '') {
    echo json_encode(['success' => false, 'message' => 'Name and sport are required']);
    exit;
}

if (isset($data['id']) && (int)$data['id'] > 0) {
    $id = (int)$data['id'];
    $stmt = $db->prepare("UPDATE venues SET name = ?, sport = ?, address = ?, city = ?, lat = ?, lng = ?, price_per_hour = ?, currency = ?, features = ?, active = ? WHERE id = ?");
    $stmt->bind_param("ssssdddssii", $name, $sport, $address, $city, $lat, $lng, $price, $currency, $features, $active, $id);
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Venue updated', 'id' => $id]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Could not update venue']);
    }
    exit;
}

$stmt = $db->prepare("INSERT INTO venues (name, sport, address, city, lat, lng, price_per_hour, currency, features, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param("ssssdddssi", $name, $sport, $address, $city, $lat, $lng, $price, $currency, $features, $active);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Venue saved', 'id' => $db->insert_id]);
} else {
    echo json_encode(['success' => false, 'message' => 'Could not save venue']);
}

$db->close();
