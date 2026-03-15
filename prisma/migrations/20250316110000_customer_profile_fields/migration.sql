-- Поля профиля в «Мои данные»: фамилия, отчество, день рождения, email, город, согласие на рассылку
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "patronymic" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "consentToMailing" BOOLEAN NOT NULL DEFAULT false;
