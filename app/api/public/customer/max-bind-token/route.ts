import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function generateBindToken(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36).slice(-6);
  return `bind_${ts}${rand}`;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    tenantId?: string;
    customerId?: string;
    phone?: string;
  };

  const tenantId = body.tenantId?.trim();
  if (!tenantId) {
    console.log("[max-bind-token] missing tenantId", { body });
    return NextResponse.json({ error: "tenantId обязателен" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId, isActive: true },
    select: { id: true, settings: { select: { messengerMaxBotId: true, messengerMaxAppId: true } } },
  });
  if (!tenant) {
    console.log("[max-bind-token] tenant not found", { tenantId });
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }
  const maxBotId =
    tenant.settings?.messengerMaxAppId ??
    tenant.settings?.messengerMaxBotId ??
    null;
  if (!maxBotId) {
    console.log("[max-bind-token] max bot not configured", {
      tenantId,
      messengerMaxBotId: tenant.settings?.messengerMaxBotId,
      messengerMaxAppId: tenant.settings?.messengerMaxAppId,
    });
    return NextResponse.json({ error: "MAX бот не настроен" }, { status: 400 });
  }

  let customer = null;
  if (body.customerId) {
    customer = await prisma.customer.findFirst({
      where: { id: body.customerId, tenantId },
    });
    if (!customer) {
      console.log("[max-bind-token] customer by id not found", {
        tenantId,
        customerId: body.customerId,
      });
    }
  }
  const phone = body.phone?.trim();
  if (!customer && phone) {
    customer = await prisma.customer.findUnique({
      where: { tenantId_phone: { tenantId, phone } },
    });
    if (!customer) {
      console.log("[max-bind-token] customer by phone not found", {
        tenantId,
        phoneSuffix: phone.slice(-4),
      });
    }
  }
  if (!customer) {
    console.log("[max-bind-token] customer not found for bind", {
      tenantId,
      customerId: body.customerId,
      phoneSuffix: phone?.slice(-4),
    });
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // Срок жизни токена — 10 минут
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const token = generateBindToken();
  await prisma.maxBindToken.create({
    data: {
      tenantId,
      customerId: customer.id,
      token,
      expiresAt,
    },
  });

  console.log("[max-bind-token] token created", {
    tenantId,
    customerId: customer.id,
    tokenSuffix: token.slice(-6),
    maxBotId,
  });

  return NextResponse.json({
    token,
    maxBotId,
  });
}

