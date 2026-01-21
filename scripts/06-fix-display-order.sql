-- Fix displayOrder to start from 1 instead of 0
-- Update all goals to have sequential displayOrder starting from 1

UPDATE "Goals" 
SET "displayOrder" = subquery.row_num
FROM (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY COALESCE("displayOrder", 0), "createdAt") as row_num
  FROM "Goals"
) AS subquery
WHERE "Goals"."id" = subquery."id";

-- Ensure default value is 1 instead of 0 for new goals
ALTER TABLE "Goals" 
ALTER COLUMN "displayOrder" SET DEFAULT 1;
