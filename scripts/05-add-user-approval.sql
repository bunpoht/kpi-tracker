-- Add status column to Users table
ALTER TABLE "Users" 
ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) DEFAULT 'APPROVED' 
CHECK ("status" IN ('PENDING', 'APPROVED', 'REJECTED'));

-- Create Settings table for system configuration
CREATE TABLE IF NOT EXISTS "Settings" (
  "id" SERIAL PRIMARY KEY,
  "key" VARCHAR(255) UNIQUE NOT NULL,
  "value" TEXT NOT NULL,
  "description" TEXT,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO "Settings" ("key", "value", "description")
VALUES 
  ('isRegistrationOpen', 'true', 'Controls whether new user registration is allowed'),
  ('requireApproval', 'true', 'Controls whether new users require admin approval')
ON CONFLICT ("key") DO NOTHING;

-- Update existing users to APPROVED status
UPDATE "Users" SET "status" = 'APPROVED' WHERE "status" IS NULL;
