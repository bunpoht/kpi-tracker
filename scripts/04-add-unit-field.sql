-- Add unit field to Goals table
ALTER TABLE "Goals" ADD COLUMN IF NOT EXISTS "unit" VARCHAR(50) DEFAULT 'units';

-- Update existing goals to have a default unit
UPDATE "Goals" SET "unit" = 'units' WHERE "unit" IS NULL;
