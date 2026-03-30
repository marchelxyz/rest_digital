-- Асинхронная отправка заказов в iiko (очередь + retry)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "iikoProviderStatus" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "iikoProviderError" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "iikoProviderSyncedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "iikoDispatchAttempts" INTEGER NOT NULL DEFAULT 0;
