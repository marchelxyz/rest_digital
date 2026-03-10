/**
 * GET/POST /api/restaurant/products (tenant-scoped)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEmployee } from "@/lib/auth";
import { Decimal } from "@prisma/client/runtime/library";

type ProductCreateBody = {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  imageUrl?: string;
  oldPrice?: number;
  weight?: string;
  volume?: string;
  composition?: string;
  allergens?: string;
  calories?: number;
  cookingTime?: number;
  sku?: string;
  sortOrder?: number;
  isActive?: boolean;
  isAvailable?: boolean;
  isSpicy?: boolean;
  isNew?: boolean;
  isPopular?: boolean;
  isRecommended?: boolean;
  isVegan?: boolean;
  isVegetarian?: boolean;
  isGlutenFree?: boolean;
  isHit?: boolean;
  isDiscounted?: boolean;
  customBadges?: { label: string; sortOrder?: number }[];
};

export async function GET(req: NextRequest) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const categoryId = req.nextUrl.searchParams.get("categoryId");
  const search = req.nextUrl.searchParams.get("search");
  const status = req.nextUrl.searchParams.get("status"); // active | hidden | unavailable
  const list = await prisma.product.findMany({
    where: {
      tenantId: emp.tenantId,
      ...(categoryId && { categoryId }),
      ...(search && {
        name: { contains: search, mode: "insensitive" as const },
      }),
      ...(status === "hidden" && { isActive: false }),
      ...(status === "unavailable" && { isActive: true, isAvailable: false }),
      ...(status === "active" && { isActive: true, isAvailable: true }),
    },
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
    include: {
      category: true,
      modifierGroups: {
        orderBy: { sortOrder: "asc" },
        include: {
          options: { orderBy: { sortOrder: "asc" } },
        },
      },
      productBadges: { orderBy: { sortOrder: "asc" } },
    },
  });
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as ProductCreateBody;
  const name = body.name?.trim();
  const categoryId = body.categoryId;
  const price = body.price;
  if (!name || !categoryId || price == null) {
    return NextResponse.json(
      { error: "name, categoryId, price обязательны" },
      { status: 400 }
    );
  }
  if (price < 0) {
    return NextResponse.json({ error: "Цена не может быть отрицательной" }, { status: 400 });
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
      price: new Decimal(price),
      oldPrice: body.oldPrice != null ? new Decimal(body.oldPrice) : null,
      categoryId,
      imageUrl: body.imageUrl ?? null,
      weight: body.weight?.trim() ?? null,
      volume: body.volume?.trim() ?? null,
      composition: body.composition?.trim() ?? null,
      allergens: body.allergens?.trim() ?? null,
      calories: body.calories ?? null,
      cookingTime: body.cookingTime ?? null,
      sku: body.sku?.trim() ?? null,
      sortOrder: body.sortOrder ?? 0,
      isActive: body.isActive ?? true,
      isAvailable: body.isAvailable ?? true,
      isSpicy: body.isSpicy ?? false,
      isNew: body.isNew ?? false,
      isPopular: body.isPopular ?? false,
      isRecommended: body.isRecommended ?? false,
      isVegan: body.isVegan ?? false,
      isVegetarian: body.isVegetarian ?? false,
      isGlutenFree: body.isGlutenFree ?? false,
      isHit: body.isHit ?? false,
      isDiscounted: body.isDiscounted ?? false,
    },
  });

  if (body.customBadges?.length) {
    await prisma.productBadgeItem.createMany({
      data: body.customBadges.map((b, i) => ({
        productId: product.id,
        label: b.label.trim(),
        sortOrder: b.sortOrder ?? i,
      })),
    });
  }

  const created = await prisma.product.findUnique({
    where: { id: product.id },
    include: {
      category: true,
      modifierGroups: { include: { options: true } },
      productBadges: true,
    },
  });
  return NextResponse.json(created);
}
