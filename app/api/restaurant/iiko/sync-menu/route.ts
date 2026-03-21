/**
 * POST /api/restaurant/iiko/sync-menu
 * Синхронизация меню из iiko для текущего tenant (партнёрский кабинет).
 */
import { NextRequest, NextResponse } from "next/server";
import { getEmployee } from "@/lib/auth";
import { syncIikoMenuForTenant } from "@/lib/iiko/sync-menu";

export async function POST(_req: NextRequest) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncIikoMenuForTenant(emp.tenantId);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
