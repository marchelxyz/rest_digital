/**
 * GET /api/superadmin/tenants - список
 * POST /api/superadmin/tenants - создать
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSuperadmin } from "@/lib/auth";

export async function GET() {
  const admin = await getSuperadmin();
  if (!admin || admin.type !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: { settings: true },
  });
  return NextResponse.json(tenants);
}

export async function POST(req: NextRequest) {
  const admin = await getSuperadmin();
  if (!admin || admin.type !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { name?: string; slug?: string };
  const name = body.name?.trim();
  const slug = body.slug?.trim().toLowerCase().replace(/\s+/g, "-") || "";
  if (!name || !slug) {
    return NextResponse.json({ error: "name и slug обязательны" }, { status: 400 });
  }
  const exists = await prisma.tenant.findUnique({ where: { slug } });
  if (exists) {
    return NextResponse.json({ error: "Tenant с таким slug уже существует" }, { status: 400 });
  }
  const tenant = await prisma.tenant.create({
    data: { name, slug },
  });
  await prisma.tenantSettings.create({
    data: { tenantId: tenant.id },
  });
  return NextResponse.json(tenant);
}
