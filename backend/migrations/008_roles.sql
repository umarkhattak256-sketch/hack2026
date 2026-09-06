-- Rename legacy roles to ShowUp2Move roles.
ALTER TABLE users
  MODIFY role ENUM('donor','ngo','member','captain','admin') NULL;

UPDATE users SET role = 'member' WHERE role = 'donor';
UPDATE users SET role = 'captain' WHERE role = 'ngo';

ALTER TABLE users
  MODIFY role ENUM('member','captain','admin') NULL;
