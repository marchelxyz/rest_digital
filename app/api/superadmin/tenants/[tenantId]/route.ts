/**
 * GET/PATCH/DELETE /api/superadmin/tenants/[tenantId]
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSuperadmin } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const admin = await getSuperadmin();
  if (!admin || admin.type !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { tenantId } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { settings: true },
  });
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(tenant);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const admin = await getSuperadmin();
  if (!admin || admin.type !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { tenantId } = await params;
  const body = (await req.json()) as { name?: string; slug?: string; isActive?: boolean };
  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      ...(body.name != null && { name: body.name.trim() }),
      ...(body.slug != null && { slug: body.slug.trim().toLowerCase().replace(/\s+/g, "-") }),
      ...(body.isActive != null && { isActive: body.isActive }),
    },
  });
  return NextResponse.json(tenant);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const admin = await getSuperadmin();
  if (!admin || admin.type !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { tenantId } = await params;
  await prisma.tenant.delete({ where: { id: tenantId } });
  return NextResponse.json({ ok: true });
}
