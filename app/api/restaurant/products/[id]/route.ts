/**
 * PATCH/DELETE /api/restaurant/products/[id]
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
    description?: string;
    price?: number;
    categoryId?: string;
    imageUrl?: string;
    isAvailable?: boolean;
    sortOrder?: number;
  };
  const data: Record<string, unknown> = {};
  if (body.name != null) data.name = body.name.trim();
  if (body.description != null) data.description = body.description.trim();
  if (body.price != null) data.price = body.price;
  if (body.categoryId != null) data.categoryId = body.categoryId;
  if (body.imageUrl != null) data.imageUrl = body.imageUrl;
  if (body.isAvailable != null) data.isAvailable = body.isAvailable;
  if (body.sortOrder != null) data.sortOrder = body.sortOrder;

  const updated = await prisma.product.updateMany({
    where: { id, tenantId: emp.tenantId },
    data: data as never,
  });
  if (updated.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const product = await prisma.product.findUnique({ where: { id } });
  return NextResponse.json(product);
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
  await prisma.product.deleteMany({ where: { id, tenantId: emp.tenantId } });
  return NextResponse.json({ ok: true });
}
