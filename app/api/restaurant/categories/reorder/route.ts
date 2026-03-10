/**
 * POST /api/restaurant/categories/reorder
 * Body: { order: { id: string; sortOrder: number }[] }
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEmployee } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as {
    order?: { id: string; sortOrder: number }[];
  };
  const order = body.order;
  if (!Array.isArray(order) || order.length === 0) {
    return NextResponse.json({ error: "order[] обязателен" }, { status: 400 });
  }
  const ids = order.map((o) => o.id);
  const count = await prisma.category.count({
    where: { id: { in: ids }, tenantId: emp.tenantId },
  });
  if (count !== ids.length) {
    return NextResponse.json({ error: "Некоторые категории не найдены" }, { status: 400 });
  }
  await Promise.all(
    order.map(({ id, sortOrder }) =>
      prisma.category.updateMany({
        where: { id, tenantId: emp.tenantId },
        data: { sortOrder },
      })
    )
  );
  return NextResponse.json({ ok: true });
}
