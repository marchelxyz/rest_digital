/**
 * GET  /api/public/customer/cart?customerId=... — получить корзину из БД
 * PUT  /api/public/customer/cart              — сохранить корзину в БД
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const customerId = req.nextUrl.searchParams.get("customerId");
  if (!customerId) {
    return NextResponse.json({ error: "customerId required" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { cartJson: true },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json({ cartJson: customer.cartJson ?? null });
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.customerId || typeof body.cartJson !== "string") {
    return NextResponse.json(
      { error: "customerId and cartJson (string) required" },
      { status: 400 },
    );
  }

  await prisma.customer.update({
    where: { id: body.customerId },
    data: { cartJson: body.cartJson },
  });

  return NextResponse.json({ ok: true });
}
