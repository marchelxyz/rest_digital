/**
 * GET /api/superadmin/tenants/[tenantId]/settings
 * PATCH /api/superadmin/tenants/[tenantId]/settings
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSuperadmin } from "@/lib/auth";

const SETTINGS_KEYS = [
  "logoUrl", "coverUrl", "faviconUrl", "appName",
  "primaryColor", "secondaryColor", "theme", "fontFamily",
  "showStories", "showLoyalty", "showPopular", "menuLayout",
  "borderRadius", "iikoApiKey", "rkeeperApiKey", "yandexMetricaId",
  "loyaltyType", "loyaltyStampGoal", "loyaltyCashbackPct",
  "loyaltyInteraction",
  "messengerTelegram", "messengerVk", "messengerMax",
  "messengerTelegramBotId", "messengerMaxBotId", "messengerVkGroupToken",
  "loyaltyCardGradientColors", "loyaltyCardGradientOpacity", "loyaltyCardGradientType",
  "infoAddress", "infoHours", "infoPhone", "infoTermsUrl", "infoFaqUrl",
  "infoPartnerUrl", "infoCaloriesUrl", "infoContactText",
  "infoSocialInstagram", "infoSocialTelegram", "infoSocialVk", "infoAboutText",
  "loyaltyFaqHtml", "inviteText", "inviteLink",
] as const;

type SettingsInput = Partial<{
  logoUrl: string;
  coverUrl: string;
  faviconUrl: string;
  appName: string;
  primaryColor: string;
  secondaryColor: string;
  theme: string;
  fontFamily: string;
  showStories: boolean;
  showLoyalty: boolean;
  showPopular: boolean;
  menuLayout: string;
  borderRadius: number;
  iikoApiKey: string;
  rkeeperApiKey: string;
  yandexMetricaId: string;
  loyaltyType: string;
  loyaltyStampGoal: number;
  loyaltyCashbackPct: number;
  loyaltyInteraction: string;
  infoAddress: string;
  infoHours: string;
  infoPhone: string;
  infoTermsUrl: string;
  infoFaqUrl: string;
  infoPartnerUrl: string;
  infoCaloriesUrl: string;
  infoContactText: string;
  infoSocialInstagram: string;
  infoSocialTelegram: string;
  infoSocialVk: string;
  infoAboutText: string;
  messengerTelegram: boolean;
  messengerVk: boolean;
  messengerMax: boolean;
  messengerTelegramBotId: string;
  messengerMaxBotId: string;
  messengerVkGroupToken: string;
  loyaltyCardGradientColors: string;
  loyaltyCardGradientOpacity: number;
  loyaltyCardGradientType: string;
  loyaltyFaqHtml: string;
  inviteText: string;
  inviteLink: string;
}>;

function toPrisma(data: SettingsInput): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of SETTINGS_KEYS) {
    const v = data[k];
    if (v === undefined) continue;
    if (k === "loyaltyCashbackPct" || k === "loyaltyCardGradientOpacity") out[k] = Number(v);
    else out[k] = v;
  }
  return out;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const admin = await getSuperadmin();
  if (!admin || admin.type !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { tenantId } = await params;
  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
  });
  if (!settings) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    ...settings,
    loyaltyCashbackPct: Number(settings.loyaltyCashbackPct),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const admin = await getSuperadmin();
  if (!admin || admin.type !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { tenantId } = await params;
  const body = (await req.json()) as SettingsInput;
  const data = toPrisma(body);
  const settings = await prisma.tenantSettings.upsert({
    where: { tenantId },
    create: { tenantId, ...data } as never,
    update: data as never,
  });
  return NextResponse.json({
    ...settings,
    loyaltyCashbackPct: Number(settings.loyaltyCashbackPct),
  });
}
