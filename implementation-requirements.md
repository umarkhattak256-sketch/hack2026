Phase 1 — Profiles upgrade (300+200+200 = 700p)
Goal: Profiles support a real bio, profile picture, multiple sports interests, and skill level per sport.
1.1 DB
/backend/migrations/001_profiles.sql:
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


1.2 Backend
POST /api/profile/upload-pic.php — multipart/form-data, validates image/jpeg|png|webp, max 5 MB, writes to /backend/uploads/users/<user_id>/<uuid>.<ext>, returns {url: "/uploads/users/.../x.jpg"}. Update sports_profiles.profile_pic_url.
GET/POST /api/profile/sports.php — list / replace user's sports. Body: {sports: [{sport, skill, is_primary}]}. Replace-all is simpler than diff.
Update GET /api/profile/get.php to return {profile, sports: [...]}.
1.3 Frontend
New component components/ProfilePicture.jsx — drag-drop or click-to-upload, shows current avatar, optimistic update, falls back to initials.
New component components/SportPicker.jsx — multi-select chips (the existing six sports + "Padel", "Volleyball"). Each chip has a skill dropdown. One sport is starred as primary.
Update MemberDashboard.jsx profile panel (lines 237–253) to use both. Use react-hook-form (already installed) to manage state.
Verify: Upload a photo → reloads with avatar. Add Football + Tennis with different skills → reload shows both. The avatar appears in header, in event cards, in chat bubbles (later phases).
