import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ClientApp } from "@/components/client/ClientApp";

export default async function ClientAppPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug, isActive: true },
    include: { settings: true, stories: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
  });
  if (!tenant || !tenant.settings) notFound();

  const stories = (tenant.stories ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    coverUrl: s.coverUrl,
    mediaUrl: s.mediaUrl,
    mediaType: s.mediaType,
  }));

  const categories = await prisma.category.findMany({
    where: { tenantId: tenant.id, isActive: true, isPublished: true },
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { isActive: true, isAvailable: true, isPublished: true },
        orderBy: { sortOrder: "asc" },
        include: {
          modifierGroups: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            include: {
              options: {
                where: { isActive: true },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
          productBadges: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  const s = tenant.settings;
  const settings = {
    tenantId: tenant.id,
    name: tenant.name,
    appName: s.appName ?? tenant.name,
    logoUrl: s.logoUrl,
    coverUrl: s.coverUrl,
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
  };

  return (
    <ClientApp
      settings={settings}
      stories={stories}
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        imageUrl: c.imageUrl,
        products: c.products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: Number(p.price),
          oldPrice: p.oldPrice ? Number(p.oldPrice) : undefined,
          imageUrl: p.imageUrl,
          weight: p.weight,
          volume: p.volume,
          badges: [
            ...(p.productBadges?.map((b) => b.label) ?? []),
            ...(p.isNew ? ["Новинка"] : []),
            ...(p.isHit ? ["Хит"] : []),
            ...(p.isPopular ? ["Популярное"] : []),
            ...(p.isSpicy ? ["Острое"] : []),
            ...(p.isVegan ? ["Веган"] : []),
            ...(p.isVegetarian ? ["Вегетарианское"] : []),
            ...(p.isGlutenFree ? ["Без глютена"] : []),
            ...(p.isDiscounted ? ["Акция"] : []),
          ],
          modifierGroups: p.modifierGroups?.map((g) => ({
            id: g.id,
            name: g.name,
            type: g.type,
            isRequired: g.isRequired,
            minSelect: g.minSelect,
            maxSelect: g.maxSelect,
            options: g.options.map((o) => ({
              id: o.id,
              name: o.name,
              priceDelta: Number(o.priceDelta),
            })),
          })),
        })),
      }))}
    />
  );
}
