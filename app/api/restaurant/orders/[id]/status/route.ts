/**
 * PATCH /api/restaurant/orders/[id]/status
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEmployee } from "@/lib/auth";

const STATUSES = ["NEW", "PREPARING", "IN_DELIVERY", "COMPLETED", "CANCELLED"] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await req.json()) as { status?: string };
  const status = body.status;
  if (!status || !STATUSES.includes(status as (typeof STATUSES)[number])) {
    return NextResponse.json({ error: "Неверный status" }, { status: 400 });
  }
  const order = await prisma.order.updateMany({
    where: { id, tenantId: emp.tenantId },
    data: { status: status as (typeof STATUSES)[number] },
  });
  if (order.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await prisma.order.findUnique({
    where: { id },
    include: { customer: true, items: { include: { product: true } } },
  });
  return NextResponse.json(updated);
}
