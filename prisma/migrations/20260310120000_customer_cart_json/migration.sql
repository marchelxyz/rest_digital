-- Добавляем поле cartJson для кросс-платформенной синхронизации корзины
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "cartJson" TEXT;
