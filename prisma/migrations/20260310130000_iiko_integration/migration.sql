-- iiko Cloud API интеграция
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "iikoApiLogin" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "iikoOrganizationId" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "iikoTerminalGroupId" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "iikoOrderTypeId" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "iikoPaymentTypeId" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "iikoWebhookSecret" TEXT;

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "iikoProductId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Product_iikoProductId_key" ON "Product"("iikoProductId") WHERE "iikoProductId" IS NOT NULL;

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "iikoOrderId" TEXT;

ALTER TABLE "ModifierGroup" ADD COLUMN IF NOT EXISTS "iikoProductGroupId" TEXT;
ALTER TABLE "ModifierOption" ADD COLUMN IF NOT EXISTS "iikoProductId" TEXT;
ALTER TABLE "ModifierOption" ADD COLUMN IF NOT EXISTS "iikoProductGroupId" TEXT;
