CREATE TABLE IF NOT EXISTS sport_rules (
  sport VARCHAR(60) PRIMARY KEY,
  min_players INT NOT NULL,
  max_players INT NOT NULL,
  default_duration_min INT DEFAULT 60,
  icon VARCHAR(20) NULL
);

INSERT IGNORE INTO sport_rules (sport, min_players, max_players, default_duration_min, icon) VALUES
('Football', 10, 14, 90, '⚽'),
('Basketball', 6, 10, 60, '🏀'),
('Tennis', 2, 4, 60, '🎾'),
('Volleyball', 8, 12, 60, '🏐'),
('Padel', 4, 4, 90, '🎾'),
('Running', 2, 20, 45, '🏃');
