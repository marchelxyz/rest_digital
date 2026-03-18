/**
 * POST /api/restaurant/loyalty/scan
 * Найти гостя по коду (QR/ввод): referralCode или телефон.
 */
import { NextRequest, NextResponse } from "next/server";
import { getEmployee } from "@/lib/auth";
import { getLoyaltyProviderForTenant } from "@/lib/loyalty/provider";

export async function POST(req: NextRequest) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { code?: string };
  const codeRaw = (body.code ?? "").trim();
  if (!codeRaw) return NextResponse.json({ error: "code обязателен" }, { status: 400 });

  try {
    const provider = await getLoyaltyProviderForTenant(emp.tenantId);
    const result = await provider.scanByCode({ tenantId: emp.tenantId, code: codeRaw });
    return NextResponse.json({
      id: result.customer.id,
      phone: result.customer.phone,
      name: result.customer.name,
      points: result.balance.points,
      stamps: result.balance.stamps,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = msg === "Гость не найден" ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

