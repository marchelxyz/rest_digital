-- Переименовываем MaxBindToken → BindToken, добавляем targetPlatform
ALTER TABLE "MaxBindToken" RENAME TO "BindToken";
ALTER TABLE "BindToken" ADD COLUMN IF NOT EXISTS "targetPlatform" TEXT NOT NULL DEFAULT 'max';

-- Новые поля для ID приложений в мессенджерах (для формирования deep link)
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "messengerTelegramAppId" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "messengerVkAppId" TEXT;
