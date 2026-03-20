-- CreateEnum
CREATE TYPE "MailingChannel" AS ENUM ('TELEGRAM', 'VK', 'MAX');

-- CreateEnum
CREATE TYPE "MailingStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'PAUSED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "MailingLogStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "Mailing" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "channel" "MailingChannel" NOT NULL,
    "status" "MailingStatus" NOT NULL DEFAULT 'DRAFT',
    "bodyHtml" TEXT NOT NULL,
    "bodyPlain" TEXT,
    "mediaJson" TEXT,
    "buttonsJson" TEXT,
    "segmentId" TEXT,
    "rateLimit" INTEGER NOT NULL DEFAULT 50,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mailing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailingSegment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "ageFrom" INTEGER,
    "ageTo" INTEGER,
    "platforms" TEXT,
    "avgCheckFrom" DECIMAL(10,2),
    "avgCheckTo" DECIMAL(10,2),
    "categoryIds" TEXT,
    "maxMessagesPerHour" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailingSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailingLog" (
    "id" TEXT NOT NULL,
    "mailingId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "channel" "MailingChannel" NOT NULL,
    "status" "MailingLogStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MailingLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Mailing" ADD CONSTRAINT "Mailing_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mailing" ADD CONSTRAINT "Mailing_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "MailingSegment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailingLog" ADD CONSTRAINT "MailingLog_mailingId_fkey" FOREIGN KEY ("mailingId") REFERENCES "Mailing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
