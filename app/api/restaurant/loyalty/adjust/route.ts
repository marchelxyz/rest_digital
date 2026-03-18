/**
 * POST /api/restaurant/loyalty/adjust
 * Списать/начислить баллы или штампы в нашей системе (app_only).
 */
import { NextRequest, NextResponse } from "next/server";
import { getEmployee } from "@/lib/auth";
import { getLoyaltyProviderForTenant } from "@/lib/loyalty/provider";

export async function POST(req: NextRequest) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    customerId?: string;
    deltaPoints?: number;
    deltaStamps?: number;
  };
  const customerId = body.customerId;
  if (!customerId) return NextResponse.json({ error: "customerId обязателен" }, { status: 400 });
  try {
    const provider = await getLoyaltyProviderForTenant(emp.tenantId);
    const result = await provider.adjust({
      tenantId: emp.tenantId,
      actorRole: emp.role,
      input: { customerId, deltaPoints: body.deltaPoints, deltaStamps: body.deltaStamps },
    });
    return NextResponse.json({
      id: result.customerId,
      points: result.balance.points,
      stamps: result.balance.stamps,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status =
      msg === "Forbidden"
        ? 403
        : msg === "Гость не найден"
          ? 404
          : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

