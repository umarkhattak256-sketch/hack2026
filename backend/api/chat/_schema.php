<?php
function ensureChatSchema($db) {
    $db->query("CREATE TABLE IF NOT EXISTS chat_messages (
        id INT PRIMARY KEY AUTO_INCREMENT,
        group_id INT NULL,
        event_id INT NULL,
        user_id INT NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_group (group_id, created_at),
        KEY idx_event (event_id, created_at)
    )");

    // Membership-check tables. Safe no-ops if they exist.
    $db->query("CREATE TABLE IF NOT EXISTS group_members (
        id INT PRIMARY KEY AUTO_INCREMENT,
        group_id INT NOT NULL,
        user_id INT NOT NULL,
        status ENUM('matched','confirmed','declined','removed') DEFAULT 'matched',
        fit_score DECIMAL(5,2) NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_group_user (group_id, user_id),
        KEY idx_group (group_id),
        KEY idx_user (user_id)
    )");

    $db->query("CREATE TABLE IF NOT EXISTS event_members (
        id INT PRIMARY KEY AUTO_INCREMENT,
        event_id INT NOT NULL,
        user_id INT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'joined',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_event_user (event_id, user_id)
    )");
}

// Membership check — true if the user is in either the group_members table for this
// group_id OR the event_members table for this event_id (whichever is supplied).
function userIsChatMember($db, $userId, $groupId, $eventId) {
    if ($userId <= 0) return false;
    if ($groupId > 0) {
        $stmt = $db->prepare("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ? AND status IN ('matched','confirmed') LIMIT 1");
        $stmt->bind_param("ii", $groupId, $userId);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) return true;
    }
    if ($eventId > 0) {
        $stmt = $db->prepare("SELECT 1 FROM event_members WHERE event_id = ? AND user_id = ? AND status = 'joined' LIMIT 1");
        $stmt->bind_param("ii", $eventId, $userId);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) return true;
        // Also allow the captain (who isn't always in event_members for legacy seed events).
        $stmt = $db->prepare("SELECT 1 FROM events e JOIN users u ON u.name = e.captain_name WHERE e.id = ? AND u.id = ? LIMIT 1");
        $stmt->bind_param("ii", $eventId, $userId);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) return true;
    }
    return false;
}
