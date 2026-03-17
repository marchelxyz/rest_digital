/**
 * GET /api/superadmin/tenants/[tenantId]/iiko/config
 * Получить организации, терминалы, типы заказов и оплаты для настройки iiko.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSuperadmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getAccessToken,
  getOrganizations,
  getTerminalGroups,
  getOrderTypes,
  getPaymentTypes,
} from "@/lib/iiko/client";

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
  if (!settings?.iikoApiLogin?.trim()) {
    return NextResponse.json(
      { error: "Сначала укажите API-ключ iiko" },
      { status: 400 }
    );
  }

  try {
    const token = await getAccessToken(settings.iikoApiLogin.trim());
    const orgs = await getOrganizations(token);
    const orgIds = orgs.map((o) => o.id);
    const [termGroups, orderTypes, paymentTypes] = await Promise.all([
      getTerminalGroups(token, orgIds),
      getOrderTypes(token, orgIds),
      getPaymentTypes(token, orgIds),
    ]);

    const orgList = orgs.map((o) => ({ id: o.id, name: o.name }));
    const tgByOrg = new Map<string, { id: string; name: string }[]>();
    for (const tg of termGroups) {
      tgByOrg.set(tg.organizationId, tg.items);
    }
    const otByOrg = new Map<string, { id: string; name: string; orderServiceType: string }[]>();
    for (const ot of orderTypes) {
      otByOrg.set(ot.organizationId, ot.items);
    }

    return NextResponse.json({
      organizations: orgList,
      terminalGroupsByOrg: Object.fromEntries(tgByOrg),
      orderTypesByOrg: Object.fromEntries(otByOrg),
      paymentTypes,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
