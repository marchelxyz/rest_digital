/**
 * PATCH/DELETE /api/restaurant/modifier-groups/[id]
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
  const body = (await req.json()) as {
    name?: string;
    type?: "single" | "multiple" | "quantity";
    isRequired?: boolean;
    minSelect?: number;
    maxSelect?: number;
    sortOrder?: number;
    isActive?: boolean;
  };

  const group = await prisma.modifierGroup.findFirst({
    where: { id, tenantId: emp.tenantId },
  });
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.name != null) data.name = body.name.trim();
  if (body.type != null) {
    if (!["single", "multiple", "quantity"].includes(body.type)) {
      return NextResponse.json({ error: "type должен быть single, multiple или quantity" }, { status: 400 });
    }
    data.type = body.type;
  }
  if (body.isRequired != null) data.isRequired = body.isRequired;
  if (body.minSelect != null) data.minSelect = body.minSelect;
  if (body.maxSelect != null) data.maxSelect = body.maxSelect;
  if (body.sortOrder != null) data.sortOrder = body.sortOrder;
  if (body.isActive != null) data.isActive = body.isActive;

  if (data.minSelect != undefined && data.maxSelect != undefined) {
    if ((data.maxSelect as number) < (data.minSelect as number)) {
      return NextResponse.json({ error: "maxSelect должен быть >= minSelect" }, { status: 400 });
    }
  }

  const updated = await prisma.modifierGroup.update({
    where: { id },
    data: data as never,
    include: { options: { orderBy: { sortOrder: "asc" } } },
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
  const group = await prisma.modifierGroup.findFirst({
    where: { id, tenantId: emp.tenantId },
  });
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.modifierGroup.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
