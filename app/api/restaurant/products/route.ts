/**
 * GET/POST /api/restaurant/products (tenant-scoped)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEmployee } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const categoryId = req.nextUrl.searchParams.get("categoryId");
  const list = await prisma.product.findMany({
    where: { tenantId: emp.tenantId, ...(categoryId && { categoryId }) },
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
    include: { category: true },
  });
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as {
    name?: string;
    description?: string;
    price?: number;
    categoryId?: string;
    imageUrl?: string;
    sortOrder?: number;
  };
  const name = body.name?.trim();
  const categoryId = body.categoryId;
  const price = body.price;
  if (!name || !categoryId || price == null) {
    return NextResponse.json({ error: "name, categoryId, price обязательны" }, { status: 400 });
  }
  const cat = await prisma.category.findFirst({
    where: { id: categoryId, tenantId: emp.tenantId },
  });
  if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 400 });
  const product = await prisma.product.create({
    data: {
      tenantId: emp.tenantId,
      name,
      description: body.description?.trim() ?? null,
      price,
      categoryId,
      imageUrl: body.imageUrl ?? null,
      sortOrder: body.sortOrder ?? 0,
    },
  });
  return NextResponse.json(product);
}
