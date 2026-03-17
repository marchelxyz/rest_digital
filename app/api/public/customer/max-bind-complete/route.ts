import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * @deprecated Используйте /api/public/customer/bind-complete.
 * Сохранён для обратной совместимости.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as { tenantId?: string; maxUserId?: string; token?: string };
  const tenantId = body.tenantId?.trim();
  const maxUserId = body.maxUserId?.trim();
  const token = body.token?.trim();

  if (!tenantId || !maxUserId || !token) {
    return NextResponse.json({ error: "tenantId, maxUserId и token обязательны" }, { status: 400 });
  }

  const bind = await prisma.bindToken.findFirst({
    where: { tenantId, token, usedAt: null, expiresAt: { gt: new Date() } },
  });
  if (!bind) {
    return NextResponse.json({ error: "Токен недействителен или истёк" }, { status: 400 });
  }

  const customer = await prisma.customer.findFirst({ where: { id: bind.customerId, tenantId } });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.customer.update({ where: { id: customer.id }, data: { maxUserId } }),
    prisma.bindToken.update({ where: { id: bind.id }, data: { usedAt: new Date() } }),
  ]);

  return NextResponse.json({ ok: true });
}
