-- Fix completedWork to be the sum of subMetricValues for records that have sub-metrics
-- This ensures that charts relying on completedWork (like the homepage) show correct totals

UPDATE "WorkLogs"
SET "completedWork" = (
  SELECT COALESCE(SUM(value::numeric), 0)
  FROM jsonb_each_text("subMetricValues")
)
WHERE "subMetricValues" IS NOT NULL;
