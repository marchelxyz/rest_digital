-- Временные токены привязки аккаунта MAX к существующему профилю
CREATE TABLE IF NOT EXISTS "MaxBindToken" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaxBindToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MaxBindToken_token_key" ON "MaxBindToken"("token");
CREATE INDEX IF NOT EXISTS "MaxBindToken_tenantId_idx" ON "MaxBindToken"("tenantId");
CREATE INDEX IF NOT EXISTS "MaxBindToken_customerId_idx" ON "MaxBindToken"("customerId");

ALTER TABLE "MaxBindToken"
ADD CONSTRAINT "MaxBindToken_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MaxBindToken"
ADD CONSTRAINT "MaxBindToken_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

