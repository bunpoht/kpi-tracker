-- Add displayOrder and isVisible columns to Goals table
ALTER TABLE "Goals" 
ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "isVisible" BOOLEAN DEFAULT true;

-- Update existing goals with sequential order
UPDATE "Goals" 
SET "displayOrder" = subquery.row_num
FROM (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt") as row_num
  FROM "Goals"
) AS subquery
WHERE "Goals"."id" = subquery."id";
