-- Set final ShowUp2Move roles.
ALTER TABLE users
  MODIFY role ENUM('member','captain','admin') NULL;