-- loyaltyType, info tab fields for TenantSettings
ALTER TABLE "TenantSettings" ADD COLUMN "loyaltyType" TEXT NOT NULL DEFAULT 'points';
ALTER TABLE "TenantSettings" ADD COLUMN "infoAddress" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN  "infoHours" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN  "infoPhone" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN  "infoTermsUrl" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN  "infoFaqUrl" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN  "infoPartnerUrl" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN  "infoCaloriesUrl" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN  "infoContactText" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN  "infoSocialInstagram" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN  "infoSocialTelegram" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN  "infoSocialVk" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN  "infoAboutText" TEXT;
