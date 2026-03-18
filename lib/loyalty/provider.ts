import { prisma } from "@/lib/db";
import type { LoyaltyProvider } from "@/lib/loyalty/types";
import { appOnlyProvider } from "@/lib/loyalty/providers/appOnly";
import { iikoProvider } from "@/lib/loyalty/providers/iiko";
import { rkeeperProvider } from "@/lib/loyalty/providers/rkeeper";

export async function getLoyaltyProviderForTenant(tenantId: string): Promise<LoyaltyProvider> {
  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId } });
  const kind = (settings?.loyaltyInteraction ?? "app_only") as "app_only" | "iiko" | "rkeeper";
  if (kind === "iiko") return iikoProvider;
  if (kind === "rkeeper") return rkeeperProvider;
  return appOnlyProvider;
}

