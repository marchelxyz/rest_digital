-- Упрощение: убрать pkpass и план подписки, оставить только способ взаимодействия с бонусной картой
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "loyaltyInteraction" TEXT NOT NULL DEFAULT 'app_only';
ALTER TABLE "TenantSettings" DROP COLUMN IF EXISTS "subscriptionPlan";
ALTER TABLE "TenantSettings" DROP COLUMN IF EXISTS "addonPkpass";
ALTER TABLE "TenantSettings" DROP COLUMN IF EXISTS "loyaltyPosIntegration";
ALTER TABLE "TenantSettings" DROP COLUMN IF EXISTS "loyaltyPkpassEnabled";
