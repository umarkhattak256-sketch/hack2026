<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/geo.php';
require_once __DIR__ . '/_schema.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true) ?: [];
$userId = isset($data['user_id']) ? (int)$data['user_id'] : 0;
$sportInput = isset($data['sport']) ? trim((string)$data['sport']) : '';
$timeWindow = isset($data['time_window']) ? trim((string)$data['time_window']) : null;

if ($userId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'User is required']);
    exit;
}

$db = getDB();
ensureMatchingSchema($db);

// 1) Resolve the requesting user's primary sport, skill, and location.
$me = null;
$meStmt = $db->prepare("SELECT u.id, u.name, sp.lat, sp.lng,
            (SELECT us.sport FROM user_sports us WHERE us.user_id = u.id ORDER BY us.is_primary DESC, us.sport ASC LIMIT 1) AS primary_sport,
            (SELECT us.skill FROM user_sports us WHERE us.user_id = u.id ORDER BY us.is_primary DESC, us.sport ASC LIMIT 1) AS primary_skill
        FROM users u
        LEFT JOIN sports_profiles sp ON sp.user_id = u.id
        WHERE u.id = ? LIMIT 1");
$meStmt->bind_param("i", $userId);
$meStmt->execute();
$meRes = $meStmt->get_result();
if ($meRes->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'User not found']);
    exit;
}
$me = $meRes->fetch_assoc();

$sport = $sportInput !== '' ? $sportInput : ($me['primary_sport'] ?: 'Football');

// 2) Read sport rule (min/max).
$ruleStmt = $db->prepare("SELECT min_players, max_players, default_duration_min FROM sport_rules WHERE sport = ? LIMIT 1");
$ruleStmt->bind_param("s", $sport);
$ruleStmt->execute();
$ruleRes = $ruleStmt->get_result();
if ($ruleRes->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => "No sport rule for $sport. Ask admin to add one."]);
    exit;
}
$rule = $ruleRes->fetch_assoc();
$minPlayers = (int)$rule['min_players'];
$maxPlayers = (int)$rule['max_players'];

// 3) If the requesting user is already in an active group for this sport today, return it.
$today = date('Y-m-d');
$activeStmt = $db->prepare("SELECT g.id FROM `groups` g
    JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = ?
    WHERE g.for_date = ? AND g.sport = ?
      AND g.status IN ('forming','ready','confirmed')
      AND gm.status IN ('matched','confirmed')
    ORDER BY g.id DESC LIMIT 1");
$activeStmt->bind_param("iss", $userId, $today, $sport);
$activeStmt->execute();
$activeRes = $activeStmt->get_result();
if ($activeRes->num_rows > 0) {
    $existingId = (int)$activeRes->fetch_assoc()['id'];
    echo json_encode(['success' => true, 'reused' => true, 'group_id' => $existingId]);
    exit;
}

// 4) Mark this user as available today for this sport. (Idempotent — Phase 2 endpoint
// may have already done it, but the UI may also call /run.php directly.)
$availStmt = $db->prepare("INSERT INTO availability_log (user_id, available, for_date, sports, time_window)
    VALUES (?, 1, ?, ?, ?)
    ON DUPLICATE KEY UPDATE available = 1, sports = VALUES(sports), time_window = COALESCE(VALUES(time_window), time_window)");
$sportsJson = json_encode([$sport]);
$availStmt->bind_param("isss", $userId, $today, $sportsJson, $timeWindow);
$availStmt->execute();

// 5) Pull all available candidates for today who play this sport AND are not already in
// an active group for this sport today.
$candStmt = $db->prepare("SELECT u.id AS user_id, u.name, u.email,
        sp.lat, sp.lng, sp.profile_pic_url,
        us.skill,
        al.time_window AS pref_time_window
    FROM users u
    JOIN user_sports us ON us.user_id = u.id AND us.sport = ?
    JOIN availability_log al ON al.user_id = u.id AND al.for_date = ? AND al.available = 1
    LEFT JOIN sports_profiles sp ON sp.user_id = u.id
    WHERE u.id NOT IN (
        SELECT gm.user_id FROM group_members gm
        JOIN `groups` g ON g.id = gm.group_id
        WHERE g.for_date = ? AND g.sport = ? AND g.status IN ('forming','ready','confirmed','event_created')
          AND gm.status IN ('matched','confirmed')
    )");
$candStmt->bind_param("ssss", $sport, $today, $today, $sport);
$candStmt->execute();
$candRes = $candStmt->get_result();

$candidates = [];
$mySkillInt = skillToInt($me['primary_skill'] ?: 'Intermediate');
$myLat = $me['lat'] !== null ? (float)$me['lat'] : null;
$myLng = $me['lng'] !== null ? (float)$me['lng'] : null;

while ($row = $candRes->fetch_assoc()) {
    $candId = (int)$row['user_id'];
    $skillInt = skillToInt($row['skill']);
    $skillDiff = abs($mySkillInt - $skillInt);
    $distanceKm = null;
    if ($myLat !== null && $myLng !== null && $row['lat'] !== null && $row['lng'] !== null) {
        $distanceKm = haversine($myLat, $myLng, (float)$row['lat'], (float)$row['lng']);
    }
    // Naive fit (Phase 9 will improve): 100 - 10*skill_diff - 0.5*distance_km, clamped.
    $fit = 100 - (10 * $skillDiff);
    if ($distanceKm !== null) {
        $fit -= 0.5 * $distanceKm;
    }
    if ($fit < 0) $fit = 0.0;
    if ($fit > 100) $fit = 100.0;

    $candidates[] = [
        'user_id' => $candId,
        'name' => $row['name'],
        'profile_pic_url' => $row['profile_pic_url'],
        'skill' => $row['skill'] ?: 'Intermediate',
        'distance_km' => $distanceKm !== null ? round($distanceKm, 2) : null,
        'fit_score' => round($fit, 2),
        'lat' => $row['lat'] !== null ? (float)$row['lat'] : null,
        'lng' => $row['lng'] !== null ? (float)$row['lng'] : null,
        'is_self' => $candId === $userId,
    ];
}

// Sort by fit DESC. The requesting user must always be included if available.
usort($candidates, function ($a, $b) {
    return $b['fit_score'] <=> $a['fit_score'];
});

$selfIncluded = false;
foreach ($candidates as $c) { if ($c['is_self']) { $selfIncluded = true; break; } }
if (!$selfIncluded) {
    // Self should appear if they're flagged available. Defensive — push them in.
    $selfFit = 100.0;
    array_unshift($candidates, [
        'user_id' => $userId,
        'name' => $me['name'],
        'profile_pic_url' => null,
        'skill' => $me['primary_skill'] ?: 'Intermediate',
        'distance_km' => 0,
        'fit_score' => $selfFit,
        'lat' => $myLat,
        'lng' => $myLng,
        'is_self' => true,
    ]);
}

$total = count($candidates);

if ($total < $minPlayers) {
    echo json_encode([
        'success' => true,
        'status' => 'waiting',
        'sport' => $sport,
        'current_count' => $total,
        'needed' => $minPlayers,
        'candidates' => $candidates,
    ]);
    exit;
}

// 6) Take top max_players (cap by max).
$selected = array_slice($candidates, 0, min($maxPlayers, $total));

// 7) Compute centroid from members with known coords.
$sumLat = 0.0; $sumLng = 0.0; $coordCount = 0;
foreach ($selected as $s) {
    if ($s['lat'] !== null && $s['lng'] !== null) {
        $sumLat += (float)$s['lat'];
        $sumLng += (float)$s['lng'];
        $coordCount++;
    }
}
$centroidLat = $coordCount > 0 ? $sumLat / $coordCount : null;
$centroidLng = $coordCount > 0 ? $sumLng / $coordCount : null;

// 8) Random captain.
$randomIndex = mt_rand(0, count($selected) - 1);
$captainUserId = (int)$selected[$randomIndex]['user_id'];

// 9) Persist the group + members in a transaction.
$db->begin_transaction();
try {
    $insertGroup = $db->prepare("INSERT INTO `groups` (sport, status, captain_user_id, for_date, time_window, centroid_lat, centroid_lng)
        VALUES (?, 'ready', ?, ?, ?, ?, ?)");
    $insertGroup->bind_param("sissdd", $sport, $captainUserId, $today, $timeWindow, $centroidLat, $centroidLng);
    $insertGroup->execute();
    $groupId = $db->insert_id;

    $memStmt = $db->prepare("INSERT INTO group_members (group_id, user_id, status, fit_score) VALUES (?, ?, 'matched', ?)");
    foreach ($selected as $s) {
        $uid = (int)$s['user_id'];
        $fit = (float)$s['fit_score'];
        $memStmt->bind_param("iid", $groupId, $uid, $fit);
        $memStmt->execute();
    }

    $db->commit();
} catch (Throwable $e) {
    $db->rollback();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to create group: ' . $e->getMessage()]);
    exit;
}

echo json_encode([
    'success' => true,
    'status' => 'ready',
    'group_id' => (int)$groupId,
    'sport' => $sport,
    'captain_user_id' => $captainUserId,
    'centroid' => $centroidLat !== null ? ['lat' => $centroidLat, 'lng' => $centroidLng] : null,
    'members' => $selected,
    'min_players' => $minPlayers,
    'max_players' => $maxPlayers,
]);

$db->close();
