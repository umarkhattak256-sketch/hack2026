<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/geo.php';
require_once __DIR__ . '/_schema.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$db = getDB();
ensureVenuesSchema($db);

$sport = isset($_GET['sport']) ? trim($_GET['sport']) : '';
$city = isset($_GET['city']) ? trim($_GET['city']) : '';
$nearLat = isset($_GET['near_lat']) && $_GET['near_lat'] !== '' ? (float)$_GET['near_lat'] : null;
$nearLng = isset($_GET['near_lng']) && $_GET['near_lng'] !== '' ? (float)$_GET['near_lng'] : null;
$radiusKm = isset($_GET['radius_km']) && $_GET['radius_km'] !== '' ? (float)$_GET['radius_km'] : null;
$limit = isset($_GET['limit']) ? max(1, min((int)$_GET['limit'], 200)) : 200;

$where = ['active = 1'];
$types = '';
$params = [];

if ($sport !== '' && strtolower($sport) !== 'all') {
    $where[] = 'sport = ?';
    $types .= 's';
    $params[] = $sport;
}
if ($city !== '') {
    $where[] = 'city = ?';
    $types .= 's';
    $params[] = $city;
}

// Cheap SQL bounding-box pre-filter when a radius is provided. This lets the index
// on (lat,lng) skip rows far away before we run the haversine.
$boxApplied = false;
if ($nearLat !== null && $nearLng !== null && $radiusKm !== null && $radiusKm > 0) {
    $box = boundingBox($nearLat, $nearLng, $radiusKm);
    $where[] = 'lat BETWEEN ? AND ?';
    $where[] = 'lng BETWEEN ? AND ?';
    $types .= 'dddd';
    array_push($params, $box['min_lat'], $box['max_lat'], $box['min_lng'], $box['max_lng']);
    $boxApplied = true;
}

$sql = "SELECT id, name, sport, address, city, lat, lng, price_per_hour, currency, features
        FROM venues WHERE " . implode(' AND ', $where) . " ORDER BY name ASC LIMIT $limit";
$stmt = $db->prepare($sql);
if ($types !== '') {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();

$venues = [];
while ($row = $result->fetch_assoc()) {
    $features = $row['features'] ? json_decode($row['features'], true) : [];
    $distanceKm = null;
    if ($nearLat !== null && $nearLng !== null && $row['lat'] !== null && $row['lng'] !== null) {
        $distanceKm = round(haversine((float)$row['lat'], (float)$row['lng'], $nearLat, $nearLng), 2);
    }

    if ($radiusKm !== null && $distanceKm !== null && $distanceKm > $radiusKm) {
        continue; // Bounding box is rectangular; trim the corners.
    }

    $venues[] = [
        'id' => (int)$row['id'],
        'name' => $row['name'],
        'sport' => $row['sport'],
        'address' => $row['address'],
        'city' => $row['city'],
        'lat' => $row['lat'] !== null ? (float)$row['lat'] : null,
        'lng' => $row['lng'] !== null ? (float)$row['lng'] : null,
        'price_per_hour' => $row['price_per_hour'] !== null ? (float)$row['price_per_hour'] : null,
        'currency' => $row['currency'],
        'features' => is_array($features) ? $features : [],
        'distance_km' => $distanceKm,
    ];
}

// Order-by-haversine (cheaper than SQL since the surviving set is small).
if ($nearLat !== null && $nearLng !== null) {
    usort($venues, function ($a, $b) {
        if ($a['distance_km'] === null) return 1;
        if ($b['distance_km'] === null) return -1;
        return $a['distance_km'] <=> $b['distance_km'];
    });
}

echo json_encode([
    'success' => true,
    'venues' => $venues,
    'origin' => $nearLat !== null && $nearLng !== null ? ['lat' => $nearLat, 'lng' => $nearLng] : null,
    'radius_km' => $radiusKm,
    'box_filter_applied' => $boxApplied,
]);
$db->close();
