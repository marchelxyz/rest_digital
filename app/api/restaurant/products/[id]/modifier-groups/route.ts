/**
 * POST /api/restaurant/products/[id]/modifier-groups
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEmployee } from "@/lib/auth";

type Body = {
  name?: string;
  type?: "single" | "multiple" | "quantity";
  isRequired?: boolean;
  minSelect?: number;
  maxSelect?: number;
  sortOrder?: number;
  isActive?: boolean;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: productId } = await params;
  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId: emp.tenantId },
  });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const body = (await req.json()) as Body;
  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "name обязателен" }, { status: 400 });

  const type = body.type ?? "single";
  if (!["single", "multiple", "quantity"].includes(type)) {
    return NextResponse.json({ error: "type должен быть single, multiple или quantity" }, { status: 400 });
  }
  const minSelect = body.minSelect ?? (body.isRequired ? 1 : 0);
  const maxSelect = body.maxSelect ?? (type === "single" ? 1 : 10);
  if (maxSelect < minSelect) {
    return NextResponse.json({ error: "maxSelect должен быть >= minSelect" }, { status: 400 });
  }

  const group = await prisma.modifierGroup.create({
    data: {
      productId,
      tenantId: emp.tenantId,
      name,
      type,
      isRequired: body.isRequired ?? false,
      minSelect,
      maxSelect,
      sortOrder: body.sortOrder ?? 0,
      isActive: body.isActive ?? true,
    },
    include: { options: true },
  });
  return NextResponse.json(group);
}
