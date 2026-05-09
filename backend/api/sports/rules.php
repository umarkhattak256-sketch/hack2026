<?php
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function ensureSportRulesSchema($db) {
    $db->query("CREATE TABLE IF NOT EXISTS sport_rules (
        sport VARCHAR(60) PRIMARY KEY,
        min_players INT NOT NULL,
        max_players INT NOT NULL,
        default_duration_min INT DEFAULT 60,
        icon VARCHAR(20) NULL
    )");

    $check = $db->query("SELECT COUNT(*) AS total FROM sport_rules");
    if ($check) {
        $row = $check->fetch_assoc();
        if ((int)$row['total'] === 0) {
            $seed = [
                ['Football', 10, 14, 90, '⚽'],
                ['Basketball', 6, 10, 60, '🏀'],
                ['Tennis', 2, 4, 60, '🎾'],
                ['Volleyball', 8, 12, 60, '🏐'],
                ['Padel', 4, 4, 90, '🎾'],
                ['Running', 2, 20, 45, '🏃'],
            ];
            $stmt = $db->prepare("INSERT IGNORE INTO sport_rules (sport, min_players, max_players, default_duration_min, icon) VALUES (?, ?, ?, ?, ?)");
            foreach ($seed as $r) {
                $stmt->bind_param("siiis", $r[0], $r[1], $r[2], $r[3], $r[4]);
                $stmt->execute();
            }
        }
    }
}

$db = getDB();
ensureSportRulesSchema($db);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $result = $db->query("SELECT sport, min_players, max_players, default_duration_min, icon FROM sport_rules ORDER BY sport ASC");
    $rules = [];
    while ($row = $result->fetch_assoc()) {
        $rules[] = [
            'sport' => $row['sport'],
            'min_players' => (int)$row['min_players'],
            'max_players' => (int)$row['max_players'],
            'default_duration_min' => (int)$row['default_duration_min'],
            'icon' => $row['icon'],
        ];
    }
    echo json_encode(['success' => true, 'rules' => $rules]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    $sport = isset($data['sport']) ? trim($data['sport']) : '';
    $min = isset($data['min_players']) ? (int)$data['min_players'] : 0;
    $max = isset($data['max_players']) ? (int)$data['max_players'] : 0;
    $duration = isset($data['default_duration_min']) ? (int)$data['default_duration_min'] : 60;
    $icon = isset($data['icon']) ? trim($data['icon']) : null;

    if ($sport === '' || $min < 1 || $max < $min) {
        echo json_encode(['success' => false, 'message' => 'Invalid rule values']);
        exit;
    }

    $stmt = $db->prepare("INSERT INTO sport_rules (sport, min_players, max_players, default_duration_min, icon)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            min_players = VALUES(min_players),
            max_players = VALUES(max_players),
            default_duration_min = VALUES(default_duration_min),
            icon = VALUES(icon)");
    $stmt->bind_param("siiis", $sport, $min, $max, $duration, $icon);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Rule saved']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Could not save rule']);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => 'Method not allowed']);
