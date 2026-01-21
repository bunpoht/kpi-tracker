-- Create SubMetrics table for goals with multiple metrics
CREATE TABLE IF NOT EXISTS "SubMetrics" (
  "id" SERIAL PRIMARY KEY,
  "goalId" INTEGER NOT NULL REFERENCES "Goals"("id") ON DELETE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "color" VARCHAR(50) NOT NULL DEFAULT '#3b82f6',
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("goalId", "name")
);

-- Add subMetricId to WorkLogs table (nullable for backward compatibility)
ALTER TABLE "WorkLogs" 
ADD COLUMN IF NOT EXISTS "subMetricId" INTEGER REFERENCES "SubMetrics"("id") ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS "idx_submetrics_goalId" ON "SubMetrics"("goalId");
CREATE INDEX IF NOT EXISTS "idx_worklogs_subMetricId" ON "WorkLogs"("subMetricId");

-- Add comment to explain the schema
COMMENT ON TABLE "SubMetrics" IS 'Stores sub-metrics for goals that need multiple tracking categories (e.g., News and Articles under one goal)';
COMMENT ON COLUMN "WorkLogs"."subMetricId" IS 'Optional reference to sub-metric. NULL means work log applies to main goal without sub-metric';
