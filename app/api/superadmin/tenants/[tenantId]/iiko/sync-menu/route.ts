/**
 * POST /api/superadmin/tenants/[tenantId]/iiko/sync-menu
 * Синхронизация меню из iiko: сначала nomenclature, если пусто — external menu.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSuperadmin } from "@/lib/auth";
import { syncIikoMenuForTenant } from "@/lib/iiko/sync-menu";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const admin = await getSuperadmin();
  if (!admin || admin.type !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { tenantId } = await params;

  try {
    const result = await syncIikoMenuForTenant(tenantId);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
