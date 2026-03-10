/**
 * Seed: Superadmin + тестовый Tenant + Employee
 * npm run db:seed
 *
 * Superadmin берётся из env: SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD
 * По умолчанию: admin@rest.digital / admin123
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL ?? "admin@rest.digital";
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD ?? "admin123";

async function main() {
  const hash = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);
  const admin = await prisma.superadmin.upsert({
    where: { email: SUPERADMIN_EMAIL },
    update: { passwordHash: hash },
    create: {
      email: SUPERADMIN_EMAIL,
      passwordHash: hash,
      name: "Superadmin",
    },
  });
  console.log("Superadmin:", admin.email);

  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: "Демо-кафе",
      slug: "demo",
    },
  });
  await prisma.tenantSettings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: { tenantId: tenant.id },
  });

  const empHash = await bcrypt.hash("manager123", 10);
  const emp = await prisma.employee.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "manager@demo.local" } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "manager@demo.local",
      passwordHash: empHash,
      name: "Менеджер",
      role: "MANAGER",
    },
  });
  console.log("Employee:", emp.email);

  let cat = await prisma.category.findFirst({
    where: { tenantId: tenant.id, name: "Напитки" },
  });
  if (!cat) {
    cat = await prisma.category.create({
      data: { tenantId: tenant.id, name: "Напитки", sortOrder: 0 },
    });
  }

  const hasProducts = await prisma.product.count({ where: { tenantId: tenant.id } });
  if (hasProducts === 0) {
    await prisma.product.createMany({
      data: [
        { tenantId: tenant.id, categoryId: cat.id, name: "Капучино", price: 250, sortOrder: 0 },
        { tenantId: tenant.id, categoryId: cat.id, name: "Латте", price: 280, sortOrder: 1 },
      ],
    });
  }
  console.log("Tenant demo готов: /c/demo");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
