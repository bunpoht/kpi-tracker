-- Update admin and user passwords with correct bcrypt hash for 'admin123'
-- Hash generated using bcrypt with 10 salt rounds

UPDATE "Users" 
SET "password" = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE "email" IN ('admin@example.com', 'user@example.com');
