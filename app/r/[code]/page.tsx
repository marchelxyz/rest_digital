import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";

type PageProps = {
  params: Promise<{ code: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReferralRouterPage(props: PageProps) {
  const [{ code }, searchParams] = await Promise.all([props.params, props.searchParams]);
  const normalizedCode = decodeURIComponent(code).trim();
  if (!normalizedCode) notFound();

  const referral = await prisma.customer.findFirst({
    where: { referralCode: normalizedCode },
    select: { tenantId: true },
  });
  if (!referral) notFound();

  const tenant = await prisma.tenant.findUnique({
    where: { id: referral.tenantId, isActive: true },
    select: { slug: true, settings: true },
  });
  if (!tenant || !tenant.settings) notFound();

  const s = tenant.settings;
  const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || "";
  const origin =
    (typeof window === "undefined"
      ? undefined
      : `${window.location.protocol}//${window.location.host}`) || baseUrl;

  // По умолчанию ведём в клиентское приложение с реф-кодом как utm-параметром
  const target = new URL(origin ? `${origin}/c/${tenant.slug}` : `/c/${tenant.slug}`, origin || undefined);
  target.searchParams.set("ref", normalizedCode);

  if (typeof searchParams.platform === "string") {
    target.searchParams.set("platform", searchParams.platform);
  }

  redirect(target.toString());
}

