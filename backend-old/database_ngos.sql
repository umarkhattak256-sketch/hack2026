-- NGOs Table for DonorTrace
CREATE TABLE IF NOT EXISTS ngos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  country VARCHAR(100) NOT NULL,
  website VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  focus_area VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample NGO
INSERT INTO ngos (name, description, country, website, email, focus_area) VALUES
('ALKHDIMAT FOUNDATION', 'Leading Pakistani humanitarian organization providing emergency relief, healthcare, education, and livelihood support to communities in need.', 'Pakistan', 'www.alkhdimat.org', 'info@alkhdimat.org', 'Humanitarian Relief'),
('Global Relief Foundation', 'Providing emergency aid and rebuilding support to flood-affected communities worldwide.', 'International', 'www.globalrelief.org', 'contact@globalrelief.org', 'Disaster Relief'),
('Water & Recovery Initiative', 'Specialized in flood disaster response with 20+ years of experience in flood zone recovery.', 'Bangladesh', 'www.waterrecovery.org', 'help@waterrecovery.org', 'Water & Flood Relief');
