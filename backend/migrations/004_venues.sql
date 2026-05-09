CREATE TABLE IF NOT EXISTS venues (
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
);

CREATE TABLE IF NOT EXISTS venue_polls (
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
);

CREATE TABLE IF NOT EXISTS venue_poll_options (
  id INT PRIMARY KEY AUTO_INCREMENT,
  poll_id INT NOT NULL,
  venue_id INT NOT NULL,
  KEY idx_poll (poll_id)
);

CREATE TABLE IF NOT EXISTS venue_votes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  poll_id INT NOT NULL,
  user_id INT NOT NULL,
  option_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_poll (poll_id, user_id),
  KEY idx_poll (poll_id)
);

INSERT IGNORE INTO venues (id, name, sport, address, city, lat, lng, price_per_hour, currency, features, active) VALUES
(1, 'Central Park Pitch', 'Football', 'Central Park West', 'Islamabad', 33.7294, 73.0931, 24.00, 'EUR', '["floodlights","showers"]', 1),
(2, 'Arena 12', 'Basketball', 'Sector 12', 'Islamabad', 33.6995, 73.0363, 36.00, 'EUR', '["indoor","floodlights"]', 1),
(3, 'Riverside Courts', 'Tennis', 'Riverside Drive', 'Islamabad', 33.7100, 73.0500, 18.00, 'EUR', '["showers"]', 1),
(4, 'School Court', 'Basketball', 'F-7 School', 'Islamabad', 33.7090, 73.0570, 0.00, 'EUR', '["outdoor"]', 1),
(5, 'Sunset Padel Club', 'Padel', 'Margalla Hills Road', 'Islamabad', 33.7400, 73.0750, 30.00, 'EUR', '["indoor","showers","floodlights"]', 1);
