-- Мессенджеры: ID ботов и токен VK
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "messengerTelegramBotId" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "messengerMaxBotId" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "messengerVkGroupToken" TEXT;

-- Бонусная карта: градиент
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "loyaltyCardGradientColors" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "loyaltyCardGradientOpacity" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "loyaltyCardGradientType" TEXT NOT NULL DEFAULT 'linear';

-- Истории: ссылка при клике
ALTER TABLE "Story" ADD COLUMN IF NOT EXISTS "linkUrl" TEXT;

-- Таблица «Для вас»
CREATE TABLE IF NOT EXISTS "ForYouProduct" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ForYouProduct_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ForYouProduct_tenantId_idx" ON "ForYouProduct"("tenantId");
CREATE INDEX IF NOT EXISTS "ForYouProduct_productId_idx" ON "ForYouProduct"("productId");

ALTER TABLE "ForYouProduct" ADD CONSTRAINT "ForYouProduct_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForYouProduct" ADD CONSTRAINT "ForYouProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
