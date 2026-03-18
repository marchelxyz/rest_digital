-- Add KBJU/cooking/composition to modifier options (for size variants like small/medium/large)
ALTER TABLE "ModifierOption"
  ADD COLUMN IF NOT EXISTS "calories" INTEGER,
  ADD COLUMN IF NOT EXISTS "protein" DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS "fat" DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS "carbohydrates" DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS "cookingTime" INTEGER,
  ADD COLUMN IF NOT EXISTS "composition" TEXT;

