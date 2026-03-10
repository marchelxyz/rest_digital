/**
 * GET/PATCH/DELETE /api/restaurant/products/[id]
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEmployee } from "@/lib/auth";
type ProductUpdateBody = {
  name?: string;
  description?: string;
  price?: number;
  oldPrice?: number;
  categoryId?: string;
  imageUrl?: string;
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { id, tenantId: emp.tenantId },
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
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await req.json()) as ProductUpdateBody;
  const data: Record<string, unknown> = {};
  if (body.name != null) data.name = body.name.trim();
  if (body.description != null) data.description = body.description.trim();
  if (body.price != null) {
    if (body.price < 0)
      return NextResponse.json({ error: "Цена не может быть отрицательной" }, { status: 400 });
    data.price = body.price;
  }
  if (body.oldPrice != null) data.oldPrice = body.oldPrice;
  if (body.categoryId != null) data.categoryId = body.categoryId;
  if (body.imageUrl != null) data.imageUrl = body.imageUrl;
  if (body.weight != null) data.weight = body.weight.trim();
  if (body.volume != null) data.volume = body.volume.trim();
  if (body.composition != null) data.composition = body.composition.trim();
  if (body.allergens != null) data.allergens = body.allergens.trim();
  if (body.calories != null) data.calories = body.calories;
  if (body.cookingTime != null) data.cookingTime = body.cookingTime;
  if (body.sku != null) data.sku = body.sku.trim();
  if (body.sortOrder != null) data.sortOrder = body.sortOrder;
  if (body.isActive != null) data.isActive = body.isActive;
  if (body.isAvailable != null) data.isAvailable = body.isAvailable;
  if (body.isSpicy != null) data.isSpicy = body.isSpicy;
  if (body.isNew != null) data.isNew = body.isNew;
  if (body.isPopular != null) data.isPopular = body.isPopular;
  if (body.isRecommended != null) data.isRecommended = body.isRecommended;
  if (body.isVegan != null) data.isVegan = body.isVegan;
  if (body.isVegetarian != null) data.isVegetarian = body.isVegetarian;
  if (body.isGlutenFree != null) data.isGlutenFree = body.isGlutenFree;
  if (body.isHit != null) data.isHit = body.isHit;
  if (body.isDiscounted != null) data.isDiscounted = body.isDiscounted;

  const updated = await prisma.product.updateMany({
    where: { id, tenantId: emp.tenantId },
    data: data as never,
  });
  if (updated.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.customBadges != null) {
    await prisma.productBadgeItem.deleteMany({ where: { productId: id } });
    if (body.customBadges.length > 0) {
      await prisma.productBadgeItem.createMany({
        data: body.customBadges.map((b, i) => ({
          productId: id,
          label: b.label.trim(),
          sortOrder: b.sortOrder ?? i,
        })),
      });
    }
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      modifierGroups: { include: { options: true } },
      productBadges: true,
    },
  });
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
  const deleted = await prisma.product.deleteMany({ where: { id, tenantId: emp.tenantId } });
  if (deleted.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
