-- iiko External Menu (fallback при пустой номенклатуре)
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "iikoExternalMenuId" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "iikoExternalMenuPriceCategoryId" TEXT;
