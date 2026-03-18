-- Product KBJU fields
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "protein" DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS "fat" DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS "carbohydrates" DECIMAL(10, 2);

-- Menu photos library for bulk upload + assignment
CREATE TABLE IF NOT EXISTS "MenuPhoto" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "fileName" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MenuPhoto_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MenuPhoto"
  ADD CONSTRAINT "MenuPhoto_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;

