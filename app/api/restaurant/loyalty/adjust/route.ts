/**
 * POST /api/restaurant/loyalty/adjust
 * Списать/начислить баллы или штампы в нашей системе (app_only).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEmployee } from "@/lib/auth";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(req: NextRequest) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (emp.role !== "OWNER" && emp.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId: emp.tenantId } });
  if (settings?.loyaltyInteraction !== "app_only") {
    return NextResponse.json(
      { error: "Операции доступны только при лояльности в приложении (app_only)" },
      { status: 400 }
    );
  }

  const body = (await req.json()) as {
    customerId?: string;
    deltaPoints?: number;
    deltaStamps?: number;
  };
  const customerId = body.customerId;
  if (!customerId) return NextResponse.json({ error: "customerId обязателен" }, { status: 400 });

  const deltaPoints = body.deltaPoints ?? 0;
  const deltaStamps = body.deltaStamps ?? 0;
  if (!Number.isFinite(deltaPoints) || !Number.isFinite(deltaStamps)) {
    return NextResponse.json({ error: "Некорректные значения" }, { status: 400 });
  }
  if (deltaPoints === 0 && deltaStamps === 0) {
    return NextResponse.json({ error: "Нужно указать deltaPoints или deltaStamps" }, { status: 400 });
  }

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId: emp.tenantId },
    select: { id: true, points: true, stamps: true },
  });
  if (!customer) return NextResponse.json({ error: "Гость не найден" }, { status: 404 });

  const nextPoints = Number(customer.points) + deltaPoints;
  const nextStamps = customer.stamps + deltaStamps;
  if (nextPoints < 0) return NextResponse.json({ error: "Недостаточно баллов" }, { status: 400 });
  if (nextStamps < 0) return NextResponse.json({ error: "Недостаточно штампов" }, { status: 400 });

  const updated = await prisma.customer.update({
    where: { id: customer.id },
    data: {
      points: new Decimal(nextPoints),
      stamps: nextStamps,
    },
    select: { id: true, points: true, stamps: true },
  });

  return NextResponse.json({ id: updated.id, points: Number(updated.points), stamps: updated.stamps });
}

