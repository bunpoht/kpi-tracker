-- Create Users table
CREATE TABLE IF NOT EXISTS "Users" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "role" VARCHAR(50) DEFAULT 'USER' CHECK ("role" IN ('ADMIN', 'USER')),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Goals table
CREATE TABLE IF NOT EXISTS "Goals" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "target" DECIMAL(10, 2) NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "createdById" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create GoalAssignments table
CREATE TABLE IF NOT EXISTS "GoalAssignments" (
  "id" SERIAL PRIMARY KEY,
  "goalId" INTEGER NOT NULL REFERENCES "Goals"("id") ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "assignedTarget" DECIMAL(10, 2) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("goalId", "userId")
);

-- Create WorkLogs table
CREATE TABLE IF NOT EXISTS "WorkLogs" (
  "id" SERIAL PRIMARY KEY,
  "goalId" INTEGER NOT NULL REFERENCES "Goals"("id") ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "completedWork" DECIMAL(10, 2) NOT NULL,
  "description" TEXT,
  "date" DATE NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Images table
CREATE TABLE IF NOT EXISTS "Images" (
  "id" SERIAL PRIMARY KEY,
  "workLogId" INTEGER NOT NULL REFERENCES "WorkLogs"("id") ON DELETE CASCADE,
  "url" TEXT NOT NULL,
  "publicId" VARCHAR(255),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_goals_createdById" ON "Goals"("createdById");
CREATE INDEX IF NOT EXISTS "idx_goalassignments_goalId" ON "GoalAssignments"("goalId");
CREATE INDEX IF NOT EXISTS "idx_goalassignments_userId" ON "GoalAssignments"("userId");
CREATE INDEX IF NOT EXISTS "idx_worklogs_goalId" ON "WorkLogs"("goalId");
CREATE INDEX IF NOT EXISTS "idx_worklogs_userId" ON "WorkLogs"("userId");
CREATE INDEX IF NOT EXISTS "idx_images_workLogId" ON "Images"("workLogId");
