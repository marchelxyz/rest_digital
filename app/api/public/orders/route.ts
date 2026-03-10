/**
 * POST /api/public/orders — создание заказа от клиента
 * Body: { tenantId, phone?, name?, type, items, address?, comment? }
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    tenantId?: string;
    phone?: string;
    name?: string;
    type?: string;
    items?: {
      productId: string;
      quantity: number;
      price: number;
      modifiers?: string;
    }[];
    address?: string;
    comment?: string;
  };
  const tenantId = body.tenantId;
  const phone = body.phone?.trim() ?? "";
  const orderType = (body.type ?? "PICKUP") as "DELIVERY" | "PICKUP" | "DINE_IN";
  const items = body.items ?? [];
  if (!tenantId || !phone || items.length === 0) {
    return NextResponse.json(
      { error: "tenantId, phone и items обязательны" },
      { status: 400 }
    );
  }
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId, isActive: true } });
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  let customer = await prisma.customer.findUnique({
    where: { tenantId_phone: { tenantId, phone } },
  });
  if (!customer) {
    customer = await prisma.customer.create({
      data: { tenantId, phone, name: body.name?.trim() ?? null },
    });
  } else if (body.name?.trim()) {
    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: { name: body.name.trim() },
    });
  }

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, tenantId, isAvailable: true },
  });
  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "Некоторые товары недоступны" }, { status: 400 });
  }

  let totalAmount = 0;
  const orderItems = items.map((item) => {
    const price = item.price;
    const lineTotal = price * item.quantity;
    totalAmount += lineTotal;
    return {
      productId: item.productId,
      quantity: item.quantity,
      price,
      modifiers: item.modifiers ?? null,
    };
  });

  const order = await prisma.order.create({
    data: {
      tenantId,
      customerId: customer.id,
      type: orderType,
      totalAmount,
      address: orderType === "DELIVERY" ? body.address ?? null : null,
      comment: body.comment ?? null,
      items: { create: orderItems },
    },
    include: { items: { include: { product: true } }, customer: true },
  });

  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId } });
  const stampGoal = settings?.loyaltyStampGoal ?? 6;
  const cashbackPct = settings ? Number(settings.loyaltyCashbackPct) : 0;
  const pointsToAdd = (totalAmount * cashbackPct) / 100;

  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      stamps: { increment: 1 },
      points: { increment: pointsToAdd },
    },
  });

  return NextResponse.json(order);
}
