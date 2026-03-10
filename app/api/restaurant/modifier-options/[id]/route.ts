/**
 * PATCH/DELETE /api/restaurant/modifier-options/[id]
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEmployee } from "@/lib/auth";
import { Decimal } from "@prisma/client/runtime/library";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await req.json()) as {
    name?: string;
    priceDelta?: number;
    isDefault?: boolean;
    isActive?: boolean;
    sortOrder?: number;
  };

  const opt = await prisma.modifierOption.findFirst({
    where: { id, tenantId: emp.tenantId },
  });
  if (!opt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.name != null) data.name = body.name.trim();
  if (body.priceDelta != null) data.priceDelta = new Decimal(body.priceDelta);
  if (body.isDefault != null) data.isDefault = body.isDefault;
  if (body.isActive != null) data.isActive = body.isActive;
  if (body.sortOrder != null) data.sortOrder = body.sortOrder;

  const updated = await prisma.modifierOption.update({
    where: { id },
    data: data as never,
  });
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
  const opt = await prisma.modifierOption.findFirst({
    where: { id, tenantId: emp.tenantId },
  });
  if (!opt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.modifierOption.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
