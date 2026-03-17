import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Platform = "telegram" | "vk" | "max";

const PLATFORM_USER_FIELDS: Record<Platform, string> = {
  telegram: "telegramUserId",
  vk: "vkUserId",
  max: "maxUserId",
};

/**
 * Завершает привязку аккаунта: проверяет токен и записывает platformUserId.
 * POST { tenantId, token, platform, platformUserId }
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    tenantId?: string;
    token?: string;
    platform?: string;
    platformUserId?: string;
  };

  const tenantId = body.tenantId?.trim();
  const token = body.token?.trim();
  const platform = body.platform?.trim() as Platform | undefined;
  const platformUserId = body.platformUserId?.trim();

  if (!tenantId || !token || !platform || !platformUserId) {
    console.log("[bind-complete] missing fields", {
      tenantId: !!tenantId,
      token: !!token,
      platform,
      platformUserId: !!platformUserId,
    });
    return NextResponse.json(
      { error: "tenantId, token, platform и platformUserId обязательны" },
      { status: 400 },
    );
  }

  if (!PLATFORM_USER_FIELDS[platform]) {
    return NextResponse.json({ error: "Неизвестная платформа" }, { status: 400 });
  }

  const bind = await prisma.bindToken.findFirst({
    where: { tenantId, token, usedAt: null, expiresAt: { gt: new Date() } },
  });

  if (!bind) {
    console.log("[bind-complete] token not found or expired", { tenantId, tokenSuffix: token.slice(-6) });
    return NextResponse.json({ error: "Токен недействителен или истёк" }, { status: 400 });
  }

  const customer = await prisma.customer.findFirst({
    where: { id: bind.customerId, tenantId },
  });
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const userField = PLATFORM_USER_FIELDS[platform];

  await prisma.$transaction([
    prisma.customer.update({
      where: { id: customer.id },
      data: { [userField]: platformUserId },
    }),
    prisma.bindToken.update({
      where: { id: bind.id },
      data: { usedAt: new Date() },
    }),
  ]);

  console.log("[bind-complete] success", {
    tenantId,
    customerId: customer.id,
    platform,
    platformUserId,
    tokenSuffix: token.slice(-6),
  });

  return NextResponse.json({ ok: true });
}
