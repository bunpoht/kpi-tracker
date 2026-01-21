-- Refactor WorkLogs to store sub-metric values in a single record instead of multiple records

-- Add new column to store sub-metric values as JSONB
ALTER TABLE "WorkLogs" 
ADD COLUMN IF NOT EXISTS "subMetricValues" JSONB;

-- For backward compatibility: 
-- - If goal has no sub-metrics, use completedWork as before
-- - If goal has sub-metrics, store values in subMetricValues as {"subMetricId": completedWork, ...}

-- Migrate existing data: Convert multiple work logs per date to single work log with subMetricValues
-- This is a one-time migration script

-- Example of subMetricValues format:
-- {"1": 7, "2": 1} where keys are subMetricId and values are completedWork

-- Note: subMetricId column will remain for backward compatibility but new records 
-- with sub-metrics will use subMetricValues instead

COMMENT ON COLUMN "WorkLogs"."subMetricValues" IS 'JSON object storing sub-metric values: {"subMetricId": completedWork, ...}';
