/**
 * PATCH/DELETE /api/restaurant/categories/[id]
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEmployee } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await req.json()) as { name?: string; sortOrder?: number };
  const cat = await prisma.category.updateMany({
    where: { id, tenantId: emp.tenantId },
    data: {
      ...(body.name != null && { name: body.name.trim() }),
      ...(body.sortOrder != null && { sortOrder: body.sortOrder }),
    },
  });
  if (cat.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await prisma.category.findUnique({ where: { id } });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.category.deleteMany({ where: { id, tenantId: emp.tenantId } });
  return NextResponse.json({ ok: true });
}
