-- ID пользователя в каждом мессенджере для определения аккаунта в любом канале
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "telegramUserId" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "vkUserId" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "maxUserId" TEXT;
