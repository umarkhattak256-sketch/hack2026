-- Phase 5 — geo. Adds lat/lng indexes for fast bounding-box lookups.
-- Most of the columns we need (lat, lng, city) already exist on
-- sports_profiles from migration 001 and on venues from migration 004.

DROP PROCEDURE IF EXISTS s2m_add_index;
DELIMITER //
CREATE PROCEDURE s2m_add_index(IN p_table VARCHAR(64), IN p_index VARCHAR(64), IN p_cols VARCHAR(255))
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.STATISTICS
        WHERE table_schema = DATABASE() AND table_name = p_table AND index_name = p_index
    ) THEN
        SET @sql := CONCAT('ALTER TABLE `', p_table, '` ADD INDEX `', p_index, '` (', p_cols, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

CALL s2m_add_index('venues', 'idx_lat_lng', 'lat, lng');
CALL s2m_add_index('sports_profiles', 'idx_lat_lng', 'lat, lng');

DROP PROCEDURE IF EXISTS s2m_add_index;

-- Update events to allow nullable group_id ahead of Phase 6 (idempotent).
DROP PROCEDURE IF EXISTS s2m_add_column;
DELIMITER //
CREATE PROCEDURE s2m_add_column(IN p_table VARCHAR(64), IN p_col VARCHAR(64), IN p_def VARCHAR(255))
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE table_schema = DATABASE() AND table_name = p_table AND column_name = p_col
    ) THEN
        SET @sql := CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_col, '` ', p_def);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS s2m_add_column;
