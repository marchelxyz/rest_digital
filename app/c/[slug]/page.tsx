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
    include: { settings: true },
  });
  if (!tenant || !tenant.settings) notFound();

  const categories = await prisma.category.findMany({
    where: { tenantId: tenant.id },
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { isAvailable: true },
        orderBy: { sortOrder: "asc" },
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
    loyaltyStampGoal: s.loyaltyStampGoal,
    loyaltyCashbackPct: Number(s.loyaltyCashbackPct),
  };

  return (
    <ClientApp
      settings={settings}
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        imageUrl: c.imageUrl,
        products: c.products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: Number(p.price),
          imageUrl: p.imageUrl,
        })),
      }))}
    />
  );
}
