-- Phase 6 — smart matching. groups + group_members + events.group_id link.

CREATE TABLE IF NOT EXISTS `groups` (
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
);

CREATE TABLE IF NOT EXISTS group_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  status ENUM('matched','confirmed','declined','removed') DEFAULT 'matched',
  fit_score DECIMAL(5,2) NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_group_user (group_id, user_id),
  KEY idx_group (group_id),
  KEY idx_user (user_id)
);

-- events.group_id link — idempotent.
DROP PROCEDURE IF EXISTS s2m_add_group_id;
DELIMITER //
CREATE PROCEDURE s2m_add_group_id()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE table_schema = DATABASE() AND table_name = 'events' AND column_name = 'group_id'
    ) THEN
        ALTER TABLE events ADD COLUMN group_id INT NULL, ADD KEY idx_group_id (group_id);
    END IF;
END //
DELIMITER ;
CALL s2m_add_group_id();
DROP PROCEDURE IF EXISTS s2m_add_group_id;
