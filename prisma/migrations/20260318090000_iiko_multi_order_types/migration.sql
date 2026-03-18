ALTER TABLE "TenantSettings"
  ADD COLUMN IF NOT EXISTS "iikoOrderTypeIdDelivery" TEXT,
  ADD COLUMN IF NOT EXISTS "iikoOrderTypeIdPickup" TEXT,
  ADD COLUMN IF NOT EXISTS "iikoOrderTypeIdDineIn" TEXT;

