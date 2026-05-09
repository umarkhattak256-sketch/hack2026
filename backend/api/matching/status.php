<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/_schema.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$groupId = isset($_GET['group_id']) ? (int)$_GET['group_id'] : 0;
$userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

if ($groupId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'group_id is required']);
    exit;
}

$db = getDB();
ensureMatchingSchema($db);

$groupStmt = $db->prepare("SELECT id, sport, status, captain_user_id, event_id, for_date, time_window, centroid_lat, centroid_lng FROM `groups` WHERE id = ? LIMIT 1");
$groupStmt->bind_param("i", $groupId);
$groupStmt->execute();
$gr = $groupStmt->get_result();
if ($gr->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Group not found']);
    exit;
}
$group = $gr->fetch_assoc();

$ruleStmt = $db->prepare("SELECT min_players, max_players FROM sport_rules WHERE sport = ? LIMIT 1");
$ruleStmt->bind_param("s", $group['sport']);
$ruleStmt->execute();
$rule = $ruleStmt->get_result()->fetch_assoc();
$minPlayers = (int)($rule['min_players'] ?? 2);
$maxPlayers = (int)($rule['max_players'] ?? 14);

$memStmt = $db->prepare("SELECT gm.user_id, gm.status, gm.fit_score,
        u.name, u.email,
        sp.profile_pic_url, sp.lat, sp.lng,
        (SELECT us.skill FROM user_sports us WHERE us.user_id = gm.user_id ORDER BY us.is_primary DESC LIMIT 1) AS skill
    FROM group_members gm
    JOIN users u ON u.id = gm.user_id
    LEFT JOIN sports_profiles sp ON sp.user_id = gm.user_id
    WHERE gm.group_id = ?
    ORDER BY gm.fit_score DESC, u.name ASC");
$memStmt->bind_param("i", $groupId);
$memStmt->execute();
$mr = $memStmt->get_result();
$members = [];
$myStatus = null;
$confirmedCount = 0;
$activeCount = 0;
while ($row = $mr->fetch_assoc()) {
    $uid = (int)$row['user_id'];
    if ($uid === $userId) $myStatus = $row['status'];
    if ($row['status'] === 'confirmed') $confirmedCount++;
    if (in_array($row['status'], ['matched','confirmed'], true)) $activeCount++;
    $members[] = [
        'user_id' => $uid,
        'name' => $row['name'],
        'profile_pic_url' => $row['profile_pic_url'],
        'skill' => $row['skill'] ?: 'Intermediate',
        'lat' => $row['lat'] !== null ? (float)$row['lat'] : null,
        'lng' => $row['lng'] !== null ? (float)$row['lng'] : null,
        'status' => $row['status'],
        'fit_score' => $row['fit_score'] !== null ? (float)$row['fit_score'] : null,
        'is_captain' => $uid === (int)$group['captain_user_id'],
        'is_self' => $uid === $userId,
    ];
}

// If the group has finalized into an event, attach event info.
$event = null;
if ($group['event_id']) {
    $evStmt = $db->prepare("SELECT id, title, sport, location, event_time, max_players, captain_name FROM events WHERE id = ? LIMIT 1");
    $evStmt->bind_param("i", $group['event_id']);
    $evStmt->execute();
    $er = $evStmt->get_result();
    if ($er->num_rows > 0) {
        $ev = $er->fetch_assoc();
        $event = [
            'id' => (int)$ev['id'],
            'title' => $ev['title'],
            'sport' => $ev['sport'],
            'location' => $ev['location'],
            'event_time' => $ev['event_time'],
            'max_players' => (int)$ev['max_players'],
            'captain_name' => $ev['captain_name'],
        ];
    }
}

echo json_encode([
    'success' => true,
    'group' => [
        'id' => (int)$group['id'],
        'sport' => $group['sport'],
        'status' => $group['status'],
        'captain_user_id' => $group['captain_user_id'] !== null ? (int)$group['captain_user_id'] : null,
        'event_id' => $group['event_id'] !== null ? (int)$group['event_id'] : null,
        'for_date' => $group['for_date'],
        'time_window' => $group['time_window'],
        'centroid' => $group['centroid_lat'] !== null
            ? ['lat' => (float)$group['centroid_lat'], 'lng' => (float)$group['centroid_lng']]
            : null,
    ],
    'members' => $members,
    'my_status' => $myStatus,
    'confirmed_count' => $confirmedCount,
    'active_count' => $activeCount,
    'min_players' => $minPlayers,
    'max_players' => $maxPlayers,
    'event' => $event,
]);

$db->close();
