/**
 * GET /api/restaurant/iiko-config
 * Получить конфигурацию iiko (организации, терминалы, типы заказов, оплаты)
 * для автоматического заполнения настроек партнёром.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEmployee } from "@/lib/auth";
import {
  getAccessToken,
  getOrganizations,
  getTerminalGroups,
  getOrderTypes,
  getPaymentTypes,
} from "@/lib/iiko/client";

export async function GET() {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId: emp.tenantId },
  });
  if (!settings?.iikoApiLogin?.trim()) {
    return NextResponse.json(
      { error: "Сначала укажите и сохраните API-ключ iiko" },
      { status: 400 }
    );
  }

  try {
    console.log("[iiko-config] Fetching config for tenant", emp.tenantId);
    const token = await getAccessToken(settings.iikoApiLogin.trim());
    const orgs = await getOrganizations(token);
    const orgIds = orgs.map((o) => o.id);

    const [termGroups, orderTypes, paymentTypes] = await Promise.all([
      getTerminalGroups(token, orgIds),
      getOrderTypes(token, orgIds),
      getPaymentTypes(token, orgIds),
    ]);

    const result = {
      organizations: orgs.map((o) => ({ id: o.id, name: o.name })),
      terminalGroupsByOrg: Object.fromEntries(
        termGroups.map((tg) => [tg.organizationId, tg.items])
      ),
      orderTypesByOrg: Object.fromEntries(
        orderTypes.map((ot) => [ot.organizationId, ot.items])
      ),
      paymentTypes,
    };

    console.log("[iiko-config] Success:", JSON.stringify(result, null, 2));
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[iiko-config] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
