<?php
require_once __DIR__ . '/../../lib/geo.php';
// BUGFIX: finalize queries the venues table to auto-assign a venue to a new
// event, but nothing guaranteed that table existed yet (it was only ever
// created lazily inside api/venues/*.php). If a captain finalized a group
// before anyone had opened the venues page, this crashed with an uncaught
// fatal error. Requiring the venues schema helper here fixes it.
require_once __DIR__ . '/../venues/_schema.php';

// Shared finalize routine. Returns ['success'=>bool, ...].
// Idempotent: if the group is already event_created, returns the existing event id.
if (!function_exists('runFinalize')) {
    function runFinalize($db, $groupId) {
        ensureVenuesSchema($db);
        $groupStmt = $db->prepare("SELECT id, sport, status, captain_user_id, event_id, for_date, time_window, centroid_lat, centroid_lng FROM `groups` WHERE id = ? LIMIT 1");
        $groupStmt->bind_param("i", $groupId);
        $groupStmt->execute();
        $groupRes = $groupStmt->get_result();
        if ($groupRes->num_rows === 0) {
            return ['success' => false, 'message' => 'Group not found'];
        }
        $group = $groupRes->fetch_assoc();

        if ($group['status'] === 'event_created' && $group['event_id']) {
            return ['success' => true, 'reused' => true, 'event_id' => (int)$group['event_id'], 'group_id' => $groupId];
        }

        if (!in_array($group['status'], ['ready', 'confirmed'], true)) {
            return ['success' => false, 'message' => 'Group is not ready (status=' . $group['status'] . ')'];
        }

        $ruleStmt = $db->prepare("SELECT min_players, max_players, default_duration_min FROM sport_rules WHERE sport = ? LIMIT 1");
        $ruleStmt->bind_param("s", $group['sport']);
        $ruleStmt->execute();
        $rule = $ruleStmt->get_result()->fetch_assoc();
        if (!$rule) {
            return ['success' => false, 'message' => 'Sport rule missing for ' . $group['sport']];
        }
        $minPlayers = (int)$rule['min_players'];
        $maxPlayers = (int)$rule['max_players'];

        $confStmt = $db->prepare("SELECT gm.user_id, u.name FROM group_members gm
            JOIN users u ON u.id = gm.user_id
            WHERE gm.group_id = ? AND gm.status = 'confirmed'");
        $confStmt->bind_param("i", $groupId);
        $confStmt->execute();
        $confRes = $confStmt->get_result();
        $confirmed = [];
        while ($r = $confRes->fetch_assoc()) {
            $confirmed[] = ['user_id' => (int)$r['user_id'], 'name' => $r['name']];
        }
        if (count($confirmed) < $minPlayers) {
            return ['success' => false, 'message' => 'Need ' . $minPlayers . ' confirmed (have ' . count($confirmed) . ')'];
        }

        // Pick a venue near centroid (widening rings) or fall back to any active sport venue.
        $venueRow = null;
        if ($group['centroid_lat'] !== null && $group['centroid_lng'] !== null) {
            foreach ([5, 15, 50, 500] as $rkm) {
                $box = boundingBox((float)$group['centroid_lat'], (float)$group['centroid_lng'], $rkm);
                $stmt = $db->prepare("SELECT id, name, address, city, lat, lng FROM venues
                    WHERE active = 1 AND sport = ? AND lat BETWEEN ? AND ? AND lng BETWEEN ? AND ? LIMIT 25");
                $stmt->bind_param("sdddd", $group['sport'], $box['min_lat'], $box['max_lat'], $box['min_lng'], $box['max_lng']);
                $stmt->execute();
                $res = $stmt->get_result();
                $best = null; $bestKm = INF;
                while ($vr = $res->fetch_assoc()) {
                    $km = haversine((float)$group['centroid_lat'], (float)$group['centroid_lng'], (float)$vr['lat'], (float)$vr['lng']);
                    if ($km < $bestKm) { $bestKm = $km; $best = $vr; }
                }
                if ($best) { $venueRow = $best; break; }
            }
        }
        if (!$venueRow) {
            $stmt = $db->prepare("SELECT id, name, address, city, lat, lng FROM venues WHERE active = 1 AND sport = ? LIMIT 1");
            $stmt->bind_param("s", $group['sport']);
            $stmt->execute();
            $res = $stmt->get_result();
            if ($res->num_rows > 0) $venueRow = $res->fetch_assoc();
        }
        $venueName = $venueRow ? $venueRow['name'] : 'TBD venue';

        $captainName = 'Captain';
        if (!empty($group['captain_user_id'])) {
            $cs = $db->prepare("SELECT name FROM users WHERE id = ? LIMIT 1");
            $cs->bind_param("i", $group['captain_user_id']);
            $cs->execute();
            $cr = $cs->get_result();
            if ($cr->num_rows > 0) $captainName = $cr->fetch_assoc()['name'];
        }

        $startHour = 18;
        $tw = $group['time_window'] ?? '';
        if (preg_match('/^(\d{1,2}):(\d{2})/', $tw, $m)) {
            $startHour = max(0, min(23, (int)$m[1]));
        }
        if (stripos($tw, 'morning') !== false) $startHour = 9;
        elseif (stripos($tw, 'afternoon') !== false) $startHour = 14;
        elseif (stripos($tw, 'evening') !== false) $startHour = 19;
        elseif (stripos($tw, 'night') !== false) $startHour = 21;

        $eventTime = date('Y-m-d H:i:s', strtotime($group['for_date'] . ' ' . sprintf('%02d:00:00', $startHour)));
        $title = $group['sport'] . ' meetup';
        $basePlayers = 0;

        $db->begin_transaction();
        try {
            $insertEvent = $db->prepare("INSERT INTO events (title, sport, location, event_time, max_players, base_players, captain_name, status, group_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?)");
            $insertEvent->bind_param("ssssiisi", $title, $group['sport'], $venueName, $eventTime, $maxPlayers, $basePlayers, $captainName, $groupId);
            $insertEvent->execute();
            $eventId = $db->insert_id;

            $emStmt = $db->prepare("INSERT INTO event_members (event_id, user_id, status) VALUES (?, ?, 'joined')
                ON DUPLICATE KEY UPDATE status = 'joined'");
            foreach ($confirmed as $m) {
                $uid = $m['user_id'];
                $emStmt->bind_param("ii", $eventId, $uid);
                $emStmt->execute();
            }

            $update = $db->prepare("UPDATE `groups` SET status = 'event_created', event_id = ? WHERE id = ?");
            $update->bind_param("ii", $eventId, $groupId);
            $update->execute();

            $db->commit();
        } catch (Throwable $e) {
            $db->rollback();
            return ['success' => false, 'message' => 'Could not create event: ' . $e->getMessage()];
        }

        return [
            'success' => true,
            'group_id' => $groupId,
            'event_id' => (int)$eventId,
            'event' => [
                'id' => (int)$eventId,
                'title' => $title,
                'sport' => $group['sport'],
                'location' => $venueName,
                'event_time' => $eventTime,
                'max_players' => $maxPlayers,
                'captain_name' => $captainName,
                'venue' => $venueRow ? [
                    'id' => (int)$venueRow['id'],
                    'name' => $venueRow['name'],
                    'address' => $venueRow['address'],
                    'city' => $venueRow['city'],
                    'lat' => $venueRow['lat'] !== null ? (float)$venueRow['lat'] : null,
                    'lng' => $venueRow['lng'] !== null ? (float)$venueRow['lng'] : null,
                ] : null,
            ],
            'confirmed_members' => $confirmed,
            'notification' => "Group ready! " . date('g A', strtotime($eventTime)) . " at " . $venueName,
        ];
    }
}
