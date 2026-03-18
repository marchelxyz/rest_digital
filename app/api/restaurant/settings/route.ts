/**
 * GET/PATCH /api/restaurant/settings
 * Настройки заведения (tenant-scoped) для кабинета партнёра.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEmployee } from "@/lib/auth";

const ALLOWED_KEYS = [
  "menuSource",
  "posProvider",
  "loyaltyInteraction",
  "iikoApiLogin",
  "iikoOrganizationId",
  "iikoTerminalGroupId",
  "iikoOrderTypeId",
  "iikoOrderTypeIdDelivery",
  "iikoOrderTypeIdPickup",
  "iikoOrderTypeIdDineIn",
  "iikoPaymentTypeId",
  "rkeeperApiKey",
] as const;

type SettingsPatch = Partial<Record<(typeof ALLOWED_KEYS)[number], string>>;

export async function GET() {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const settings = await prisma.tenantSettings.upsert({
    where: { tenantId: emp.tenantId },
    create: { tenantId: emp.tenantId },
    update: {},
  });
  const out: Record<string, unknown> = {};
  for (const k of ALLOWED_KEYS) out[k] = settings[k];
  return NextResponse.json(out);
}

export async function PATCH(req: NextRequest) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as SettingsPatch;
  const data: Record<string, string> = {};
  for (const k of ALLOWED_KEYS) {
    const v = body[k];
    if (v === undefined) continue;
    data[k] = v.trim();
  }
  const createData = { tenantId: emp.tenantId, ...data };
  const settings = await prisma.tenantSettings.upsert({
    where: { tenantId: emp.tenantId },
    create: createData as never,
    update: data as never,
  });
  const out: Record<string, unknown> = {};
  for (const k of ALLOWED_KEYS) out[k] = settings[k];
  return NextResponse.json(out);
}

