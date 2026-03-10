/**
 * POST /api/restaurant/modifier-groups/[id]/options
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEmployee } from "@/lib/auth";
import { Decimal } from "@prisma/client/runtime/library";

type Body = {
  name?: string;
  priceDelta?: number;
  isDefault?: boolean;
  isActive?: boolean;
  sortOrder?: number;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: modifierGroupId } = await params;
  const group = await prisma.modifierGroup.findFirst({
    where: { id: modifierGroupId, tenantId: emp.tenantId },
  });
  if (!group) return NextResponse.json({ error: "Modifier group not found" }, { status: 404 });

  const body = (await req.json()) as Body;
  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "name обязателен" }, { status: 400 });

  const option = await prisma.modifierOption.create({
    data: {
      modifierGroupId,
      tenantId: emp.tenantId,
      name,
      priceDelta: new Decimal(body.priceDelta ?? 0),
      isDefault: body.isDefault ?? false,
      isActive: body.isActive ?? true,
      sortOrder: body.sortOrder ?? 0,
    },
  });
  return NextResponse.json(option);
}
