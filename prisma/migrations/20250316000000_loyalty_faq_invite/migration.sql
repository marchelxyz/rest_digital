-- Описание программы лояльности (FAQ) и настройки приглашения друзей
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "loyaltyFaqHtml" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "inviteText" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "inviteLink" TEXT;
