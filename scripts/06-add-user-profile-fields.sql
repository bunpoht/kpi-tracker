-- Add profile picture and status fields to Users table
ALTER TABLE "Users" 
ADD COLUMN IF NOT EXISTS "profilePicture" TEXT,
ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) DEFAULT 'APPROVED' CHECK ("status" IN ('PENDING', 'APPROVED', 'REJECTED'));

-- Update existing users to have APPROVED status
UPDATE "Users" SET "status" = 'APPROVED' WHERE "status" IS NULL;
