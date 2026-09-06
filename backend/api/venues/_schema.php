<?php
function ensureVenuesSchema($db) {
    $db->query("CREATE TABLE IF NOT EXISTS venues (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(180) NOT NULL,
        sport VARCHAR(60) NOT NULL,
        address VARCHAR(255) NULL,
        city VARCHAR(120) NULL,
        lat DECIMAL(10,7) NULL,
        lng DECIMAL(10,7) NULL,
        price_per_hour DECIMAL(8,2) NULL,
        currency VARCHAR(8) DEFAULT 'EUR',
        features JSON NULL,
        active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_sport (sport),
        KEY idx_city (city)
    )");

    $db->query("CREATE TABLE IF NOT EXISTS venue_polls (
        id INT PRIMARY KEY AUTO_INCREMENT,
        group_id INT NULL,
        event_id INT NULL,
        created_by INT NOT NULL,
        status ENUM('open','closed') DEFAULT 'open',
        closes_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_event (event_id),
        KEY idx_group (group_id),
        KEY idx_status (status)
    )");

    $db->query("CREATE TABLE IF NOT EXISTS venue_poll_options (
        id INT PRIMARY KEY AUTO_INCREMENT,
        poll_id INT NOT NULL,
        venue_id INT NOT NULL,
        KEY idx_poll (poll_id)
    )");

    $db->query("CREATE TABLE IF NOT EXISTS venue_votes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        poll_id INT NOT NULL,
        user_id INT NOT NULL,
        option_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_user_poll (poll_id, user_id),
        KEY idx_poll (poll_id)
    )");

    $seed = [
        ['Central Park Pitch', 'Football', 'Central Park West', 'Islamabad', 33.7294, 73.0931, 24.00, '["floodlights","showers"]'],
        ['F-8 Futsal Arena', 'Football', 'F-8 Markaz', 'Islamabad', 33.7148, 73.0398, 28.00, '["indoor","floodlights","parking"]'],
        ['Arena 12', 'Basketball', 'Sector 12', 'Islamabad', 33.6995, 73.0363, 36.00, '["indoor","floodlights"]'],
        ['School Court', 'Basketball', 'F-7 School', 'Islamabad', 33.7090, 73.0570, 0.00, '["outdoor"]'],
        ['Riverside Courts', 'Tennis', 'Riverside Drive', 'Islamabad', 33.7100, 73.0500, 18.00, '["showers"]'],
        ['Margalla Tennis Club', 'Tennis', 'F-6 Courts', 'Islamabad', 33.7308, 73.0684, 22.00, '["outdoor","parking"]'],
        ['Sunset Padel Club', 'Padel', 'Margalla Hills Road', 'Islamabad', 33.7400, 73.0750, 30.00, '["indoor","showers","floodlights"]'],
        ['Padel House Islamabad', 'Padel', 'G-9 Sports Complex', 'Islamabad', 33.6889, 73.0332, 26.00, '["indoor","parking"]'],
        ['Community Volleyball Court', 'Volleyball', 'F-9 Park', 'Islamabad', 33.7017, 73.0366, 0.00, '["outdoor","floodlights"]'],
        ['Sports Hall Volleyball', 'Volleyball', 'G-6 Sports Hall', 'Islamabad', 33.7122, 73.0881, 16.00, '["indoor","showers"]'],
    ];

    $stmt = $db->prepare("INSERT INTO venues (name, sport, address, city, lat, lng, price_per_hour, currency, features, active)
        SELECT ?, ?, ?, ?, ?, ?, ?, 'EUR', ?, 1
        WHERE NOT EXISTS (
            SELECT 1 FROM venues
            WHERE name = ? AND sport = ? AND address <=> ? AND city <=> ?
            LIMIT 1
        )");
    if ($stmt) {
        foreach ($seed as $v) {
            $name = $v[0];
            $sport = $v[1];
            $address = $v[2];
            $city = $v[3];
            $lat = $v[4];
            $lng = $v[5];
            $price = $v[6];
            $features = $v[7];
            $stmt->bind_param(
                "ssssdddsssss",
                $name, $sport, $address, $city, $lat, $lng, $price, $features,
                $name, $sport, $address, $city
            );
            $stmt->execute();
        }
    }
}
