/**
 * GET /api/restaurant/for-you — список «Для вас»
 * POST /api/restaurant/for-you — добавить блюдо
 * PATCH /api/restaurant/for-you — обновить порядок (body: { productIds: string[] })
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEmployee } from "@/lib/auth";

export async function GET() {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const list = await prisma.forYouProduct.findMany({
    where: { tenantId: emp.tenantId },
    orderBy: { sortOrder: "asc" },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          imageUrl: true,
          weight: true,
          description: true,
          modifierGroups: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            include: {
              options: {
                where: { isActive: true },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      },
    },
  });
  const products = list
    .map((f) => f.product)
    .filter((p): p is NonNullable<typeof p> => p != null)
    .map((p) => ({
      ...p,
      price: Number(p.price),
      modifierGroups: p.modifierGroups?.map((g) => ({
        ...g,
        options: g.options?.map((o) => ({ ...o, priceDelta: Number(o.priceDelta) })),
      })),
    }));
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { productId?: string };
  const productId = body.productId?.trim();
  if (!productId) {
    return NextResponse.json({ error: "productId обязателен" }, { status: 400 });
  }
  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId: emp.tenantId },
  });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  const existing = await prisma.forYouProduct.findFirst({
    where: { tenantId: emp.tenantId, productId },
  });
  if (existing) return NextResponse.json(existing);
  const maxOrder = await prisma.forYouProduct.aggregate({
    where: { tenantId: emp.tenantId },
    _max: { sortOrder: true },
  });
  const created = await prisma.forYouProduct.create({
    data: {
      tenantId: emp.tenantId,
      productId,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
  return NextResponse.json(created);
}

export async function DELETE(req: NextRequest) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId обязателен" }, { status: 400 });
  }
  await prisma.forYouProduct.deleteMany({
    where: { tenantId: emp.tenantId, productId },
  });
  return NextResponse.json({ ok: true });
}
