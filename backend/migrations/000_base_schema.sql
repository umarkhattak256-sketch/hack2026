-- Base schema: creates the `users` table.
-- This table was missing from the project entirely — every other table
-- self-creates via CREATE TABLE IF NOT EXISTS inside the PHP endpoints,
-- but `users` did not, so registration/login failed on a fresh database.
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('member','captain','admin') NOT NULL DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_email (email)
);
