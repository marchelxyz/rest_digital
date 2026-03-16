-- Реферальная программа: поля в TenantSettings и Customer
ALTER TABLE "TenantSettings"
ADD COLUMN IF NOT EXISTS "referralBonusPoints" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "referralBonusStamps" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Customer"
ADD COLUMN IF NOT EXISTS "referralCode" TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS "invitedByCustomerId" TEXT;

ALTER TABLE "Customer"
ADD CONSTRAINT "Customer_invitedByCustomerId_fkey"
FOREIGN KEY ("invitedByCustomerId") REFERENCES "Customer"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

