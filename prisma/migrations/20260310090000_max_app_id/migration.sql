-- Добавляем отдельное поле для ID ссылки на мини‑приложение MAX
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "messengerMaxAppId" TEXT;

