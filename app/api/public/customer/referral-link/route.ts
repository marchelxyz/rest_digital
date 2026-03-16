import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function generateReferralCode(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  const ts = Date.now().toString(36).slice(-4);
  return `${ts}${rand}`;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    tenantId?: string;
    platform?: string | null;
    platformUserId?: string | null;
    phone?: string | null;
  };
  const tenantId = body.tenantId?.trim();
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId обязателен" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId, isActive: true },
    select: { id: true, slug: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const platform = body.platform ?? undefined;
  const platformUserId = body.platformUserId?.trim();
  const phone = body.phone?.trim();

  let customer = null;

  // Ищем по platformUserId, если передан
  if (platform && platformUserId) {
    const field =
      platform === "telegram" ? "telegramUserId" : platform === "vk" ? "vkUserId" : platform === "max" ? "maxUserId" : null;
    if (field) {
      customer = await prisma.customer.findFirst({
        where: { tenantId, [field]: platformUserId },
      });
    }
  }

  // Если не нашли и есть телефон — ищем по телефону
  if (!customer && phone) {
    customer = await prisma.customer.findUnique({
      where: { tenantId_phone: { tenantId, phone } },
    });
  }

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  if (!customer.referralCode) {
    let code = generateReferralCode();
    // Простая защита от коллизий
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await prisma.customer.findFirst({
        where: { referralCode: code },
        select: { id: true },
      });
      if (!existing) break;
      code = generateReferralCode();
    }

    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: { referralCode: code },
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || "";
  const origin =
    (typeof window === "undefined"
      ? undefined
      : `${window.location.protocol}//${window.location.host}`) || baseUrl;

  const referralUrl = origin
    ? `${origin}/r/${encodeURIComponent(customer.referralCode!)}`
    : `/r/${encodeURIComponent(customer.referralCode!)}`;

  return NextResponse.json({ referralUrl });
}

