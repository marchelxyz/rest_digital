-- Subscription model for loyalty: app_only | iiko | rkeeper
-- addonPkpass: pkpass add-on module
-- loyaltyPosIntegration: which POS integration is enabled
-- loyaltyPkpassEnabled: wallet pass (pkpass) enabled

ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "subscriptionPlan" TEXT NOT NULL DEFAULT 'app_only';
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "addonPkpass" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "loyaltyPosIntegration" TEXT NOT NULL DEFAULT 'app_only';
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "loyaltyPkpassEnabled" BOOLEAN NOT NULL DEFAULT false;
