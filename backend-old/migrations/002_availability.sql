CREATE TABLE IF NOT EXISTS availability_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  available TINYINT(1) NOT NULL,
  for_date DATE NOT NULL,
  sports JSON NULL,       -- which sports today (subset of user_sports)
  time_window VARCHAR(60) NULL, -- "evening", "morning", or "18:00-21:00"
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_date (user_id, for_date),
  KEY idx_for_date (for_date)
);
