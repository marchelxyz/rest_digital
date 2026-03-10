/**
 * POST /api/superadmin/tenants/[tenantId]/create-login
 * Создаёт или обновляет сотрудника OWNER с заданным email и сгенерированным паролем.
 */
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSuperadmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

function generatePassword(): string {
  return randomBytes(12).toString("base64").replace(/[+/=]/g, "").slice(0, 14);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const admin = await getSuperadmin();
  if (!admin || admin.type !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { tenantId } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const body = (await req.json()) as { email?: string };
  const email = body.email?.trim()?.toLowerCase();
  if (!email) {
    return NextResponse.json(
      { error: "email обязателен" },
      { status: 400 }
    );
  }

  const password = generatePassword();
  const passwordHash = await hashPassword(password);

  await prisma.employee.upsert({
    where: {
      tenantId_email: { tenantId, email },
    },
    create: {
      tenantId,
      email,
      passwordHash,
      name: tenant.name,
      role: "OWNER",
    },
    update: {
      passwordHash,
      role: "OWNER",
    },
  });

  return NextResponse.json({ email, password });
}
