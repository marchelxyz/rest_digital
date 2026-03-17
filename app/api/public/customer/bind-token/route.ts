import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Platform = "telegram" | "vk" | "max";

const PLATFORM_APP_ID_FIELDS: Record<Platform, string> = {
  telegram: "messengerTelegramAppId",
  vk: "messengerVkAppId",
  max: "messengerMaxAppId",
};

const PLATFORM_BOT_ID_FIELDS: Record<Platform, string | null> = {
  telegram: "messengerTelegramBotId",
  vk: null,
  max: "messengerMaxBotId",
};

function generateBindToken(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36).slice(-6);
  return `bind_${ts}${rand}`;
}

/**
 * Создаёт токен привязки аккаунта к целевой платформе.
 * POST { tenantId, targetPlatform, customerId?, phone? }
 * Ответ: { token, appId }
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    tenantId?: string;
    targetPlatform?: string;
    customerId?: string;
    phone?: string;
  };

  const tenantId = body.tenantId?.trim();
  const targetPlatform = body.targetPlatform?.trim() as Platform | undefined;

  if (!tenantId || !targetPlatform) {
    return NextResponse.json({ error: "tenantId и targetPlatform обязательны" }, { status: 400 });
  }

  if (!["telegram", "vk", "max"].includes(targetPlatform)) {
    return NextResponse.json({ error: "Неизвестная платформа" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId, isActive: true },
    select: { id: true, settings: true },
  });
  if (!tenant?.settings) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const settings = tenant.settings as Record<string, unknown>;
  const appIdField = PLATFORM_APP_ID_FIELDS[targetPlatform];
  const botIdField = PLATFORM_BOT_ID_FIELDS[targetPlatform];
  const appId =
    (settings[appIdField] as string | null) ??
    (botIdField ? (settings[botIdField] as string | null) : null);

  if (!appId) {
    return NextResponse.json(
      { error: `Приложение ${targetPlatform} не настроено` },
      { status: 400 },
    );
  }

  let customer = null;
  if (body.customerId) {
    customer = await prisma.customer.findFirst({
      where: { id: body.customerId, tenantId },
    });
  }
  const phone = body.phone?.trim();
  if (!customer && phone) {
    customer = await prisma.customer.findUnique({
      where: { tenantId_phone: { tenantId, phone } },
    });
  }
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const token = generateBindToken();

  await prisma.bindToken.create({
    data: { tenantId, customerId: customer.id, targetPlatform, token, expiresAt },
  });

  console.log("[bind-token] created", {
    tenantId,
    customerId: customer.id,
    targetPlatform,
    tokenSuffix: token.slice(-6),
    appId,
  });

  return NextResponse.json({ token, appId });
}
