import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function generateBindToken(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36).slice(-6);
  return `bind_${ts}${rand}`;
}

/**
 * @deprecated Используйте /api/public/customer/bind-token с targetPlatform="max".
 * Сохранён для обратной совместимости.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as { tenantId?: string; customerId?: string; phone?: string };
  const tenantId = body.tenantId?.trim();
  if (!tenantId) return NextResponse.json({ error: "tenantId обязателен" }, { status: 400 });

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId, isActive: true },
    select: { id: true, settings: { select: { messengerMaxBotId: true, messengerMaxAppId: true } } },
  });
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const maxBotId = tenant.settings?.messengerMaxAppId ?? tenant.settings?.messengerMaxBotId ?? null;
  if (!maxBotId) return NextResponse.json({ error: "MAX бот не настроен" }, { status: 400 });

  let customer = null;
  if (body.customerId) {
    customer = await prisma.customer.findFirst({ where: { id: body.customerId, tenantId } });
  }
  const phone = body.phone?.trim();
  if (!customer && phone) {
    customer = await prisma.customer.findUnique({ where: { tenantId_phone: { tenantId, phone } } });
  }
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const token = generateBindToken();
  await prisma.bindToken.create({
    data: { tenantId, customerId: customer.id, targetPlatform: "max", token, expiresAt },
  });

  return NextResponse.json({ token, maxBotId });
}
