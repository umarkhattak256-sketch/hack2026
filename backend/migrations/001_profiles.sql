ALTER TABLE sports_profiles
  ADD COLUMN profile_pic_url VARCHAR(500) NULL,
  ADD COLUMN lat DECIMAL(10,7) NULL,
  ADD COLUMN lng DECIMAL(10,7) NULL,
  ADD COLUMN city VARCHAR(120) NULL;

CREATE TABLE IF NOT EXISTS user_sports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  sport VARCHAR(60) NOT NULL,
  skill ENUM('Beginner','Intermediate','Advanced','Pro') NOT NULL DEFAULT 'Intermediate',
  is_primary TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_sport (user_id, sport),
  KEY idx_user (user_id),
  KEY idx_sport (sport)
);
