/**
 * POST /api/restaurant/loyalty/scan
 * Найти гостя по коду (QR/ввод): referralCode или телефон.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEmployee } from "@/lib/auth";

function normalizePhone(input: string): string {
  return input.replace(/[^\d+]/g, "").trim();
}

export async function POST(req: NextRequest) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId: emp.tenantId } });
  if (settings?.loyaltyInteraction !== "app_only") {
    return NextResponse.json(
      { error: "Сканер Rest Digital доступен только при лояльности в приложении (app_only)" },
      { status: 400 }
    );
  }

  const body = (await req.json()) as { code?: string };
  const codeRaw = (body.code ?? "").trim();
  if (!codeRaw) return NextResponse.json({ error: "code обязателен" }, { status: 400 });

  const phone = normalizePhone(codeRaw);
  const customer = await prisma.customer.findFirst({
    where: {
      tenantId: emp.tenantId,
      OR: [
        { referralCode: codeRaw },
        ...(phone ? [{ phone }] : []),
      ],
    },
    select: {
      id: true,
      phone: true,
      name: true,
      points: true,
      stamps: true,
      referralCode: true,
    },
  });

  if (!customer) return NextResponse.json({ error: "Гость не найден" }, { status: 404 });
  return NextResponse.json({
    id: customer.id,
    phone: customer.phone,
    name: customer.name,
    points: Number(customer.points),
    stamps: customer.stamps,
    referralCode: customer.referralCode,
  });
}

