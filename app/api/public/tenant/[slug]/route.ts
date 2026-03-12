/**
 * GET /api/public/tenant/[slug] — публичные настройки для клиентского приложения
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug, isActive: true },
    include: { settings: true },
  });
  if (!tenant || !tenant.settings) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const s = tenant.settings;
  return NextResponse.json({
    tenantId: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    appName: s.appName ?? tenant.name,
    logoUrl: s.logoUrl,
    coverUrl: s.coverUrl,
    faviconUrl: s.faviconUrl,
    primaryColor: s.primaryColor,
    secondaryColor: s.secondaryColor,
    theme: s.theme,
    fontFamily: s.fontFamily,
    showStories: s.showStories,
    showLoyalty: s.showLoyalty,
    showPopular: s.showPopular,
    menuLayout: s.menuLayout,
    borderRadius: s.borderRadius,
    loyaltyType: s.loyaltyType ?? "points",
    loyaltyStampGoal: s.loyaltyStampGoal,
    loyaltyCashbackPct: Number(s.loyaltyCashbackPct),
    loyaltyInteraction: s.loyaltyInteraction ?? "app_only",
    infoAddress: s.infoAddress,
    infoHours: s.infoHours,
    infoPhone: s.infoPhone,
    infoTermsUrl: s.infoTermsUrl,
    infoFaqUrl: s.infoFaqUrl,
    infoPartnerUrl: s.infoPartnerUrl,
    infoCaloriesUrl: s.infoCaloriesUrl,
    infoContactText: s.infoContactText,
    infoSocialInstagram: s.infoSocialInstagram,
    infoSocialTelegram: s.infoSocialTelegram,
    infoSocialVk: s.infoSocialVk,
    infoAboutText: s.infoAboutText,
  });
}
