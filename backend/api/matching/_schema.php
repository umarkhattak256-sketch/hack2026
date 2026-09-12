<?php
function ensureMatchingSchema($db) {
    $db->query("CREATE TABLE IF NOT EXISTS `groups` (
        id INT PRIMARY KEY AUTO_INCREMENT,
        sport VARCHAR(60) NOT NULL,
        status ENUM('forming','ready','confirmed','event_created','cancelled') DEFAULT 'forming',
        captain_user_id INT NULL,
        event_id INT NULL,
        for_date DATE NOT NULL,
        time_window VARCHAR(60) NULL,
        centroid_lat DECIMAL(10,7) NULL,
        centroid_lng DECIMAL(10,7) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_status (status),
        KEY idx_for_date (for_date),
        KEY idx_sport_date (sport, for_date)
    )");

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

    // sport_rules — endpoints assume this from Phase 3.
    $db->query("CREATE TABLE IF NOT EXISTS sport_rules (
        sport VARCHAR(60) PRIMARY KEY,
        min_players INT NOT NULL,
        max_players INT NOT NULL,
        default_duration_min INT DEFAULT 60,
        icon VARCHAR(20) NULL
    )");

    // BUGFIX: matching/run.php requires a sport_rules row to know group
    // size limits, but the seed data only ever got inserted inside
    // sports/rules.php. If a user's very first action was to run matching
    // (never having hit the rules endpoint), sport_rules stayed empty and
    // matching always failed with "No sport rule for X." Seeding it here
    // too guarantees the defaults always exist before matching runs.
    $ruleCount = $db->query("SELECT COUNT(*) AS total FROM sport_rules");
    if ($ruleCount) {
        $row = $ruleCount->fetch_assoc();
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

    // events table + the group_id column linking back to a finalized group.
    $db->query("CREATE TABLE IF NOT EXISTS events (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        sport VARCHAR(100) NOT NULL,
        location VARCHAR(255) NOT NULL,
        event_time DATETIME NOT NULL,
        max_players INT NOT NULL DEFAULT 10,
        base_players INT NOT NULL DEFAULT 0,
        captain_name VARCHAR(255) NOT NULL DEFAULT 'Captain',
        status VARCHAR(50) NOT NULL DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    $check = $db->query("SHOW COLUMNS FROM events LIKE 'group_id'");
    if ($check && $check->num_rows === 0) {
        $db->query("ALTER TABLE events ADD COLUMN group_id INT NULL, ADD KEY idx_group_id (group_id)");
    }

    $db->query("CREATE TABLE IF NOT EXISTS event_members (
        id INT PRIMARY KEY AUTO_INCREMENT,
        event_id INT NOT NULL,
        user_id INT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'joined',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_event_user (event_id, user_id)
    )");

    $db->query("CREATE TABLE IF NOT EXISTS availability_log (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        available TINYINT(1) NOT NULL,
        for_date DATE NOT NULL,
        sports JSON NULL,
        time_window VARCHAR(60) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_user_date (user_id, for_date),
        KEY idx_for_date (for_date)
    )");

    $db->query("CREATE TABLE IF NOT EXISTS user_sports (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        sport VARCHAR(60) NOT NULL,
        skill ENUM('Beginner','Intermediate','Advanced','Pro') NOT NULL DEFAULT 'Intermediate',
        is_primary TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_user_sport (user_id, sport),
        KEY idx_user (user_id),
        KEY idx_sport (sport)
    )");

    // BUGFIX: matching/run.php joins against sports_profiles (for lat/lng),
    // but this table was only ever created lazily inside the profile/*.php
    // endpoints. A user who never opened their profile page had no
    // sports_profiles row/table yet, which crashed matching with an
    // uncaught fatal error. Ensuring it here guarantees it always exists
    // before matching runs.
    $db->query("CREATE TABLE IF NOT EXISTS sports_profiles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL UNIQUE,
        bio TEXT,
        sport VARCHAR(100) NOT NULL DEFAULT 'Football',
        skill VARCHAR(100) NOT NULL DEFAULT 'Intermediate',
        area VARCHAR(255) NOT NULL DEFAULT 'Central Park',
        available TINYINT(1) NOT NULL DEFAULT 1,
        profile_pic_url VARCHAR(500) NULL,
        lat DECIMAL(10,7) NULL,
        lng DECIMAL(10,7) NULL,
        city VARCHAR(120) NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
}

function skillToInt($skill) {
    static $map = [
        'Beginner' => 1,
        'Intermediate' => 2,
        'Advanced' => 3,
        'Pro' => 4,
    ];
    return $map[$skill] ?? 2;
}
