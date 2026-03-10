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
  const body = (await req.json()) as {
    name?: string;
    description?: string;
    sortOrder?: number;
    imageUrl?: string;
    isActive?: boolean;
    isPublished?: boolean;
  };
  const data: Record<string, unknown> = {};
  if (body.name != null) data.name = body.name.trim();
  if (body.description != null) data.description = body.description.trim();
  if (body.sortOrder != null) data.sortOrder = body.sortOrder;
  if (body.imageUrl != null) data.imageUrl = body.imageUrl;
  if (body.isActive != null) data.isActive = body.isActive;
  if (body.isPublished != null) data.isPublished = body.isPublished;
  const cat = await prisma.category.updateMany({
    where: { id, tenantId: emp.tenantId },
    data: data as never,
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
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: "Нельзя удалить категорию с блюдами. Сначала переместите или удалите блюда." },
      { status: 400 }
    );
  }
  await prisma.category.deleteMany({ where: { id, tenantId: emp.tenantId } });
  return NextResponse.json({ ok: true });
}
