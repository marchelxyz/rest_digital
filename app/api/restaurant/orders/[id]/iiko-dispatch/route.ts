/**
 * POST /api/restaurant/orders/[id]/iiko-dispatch
 * Ручная постановка заказа в очередь отправки в iiko (повтор при ошибке).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEmployee } from "@/lib/auth";
import { enqueueIikoOrderDispatch } from "@/lib/iiko/order-dispatch";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id, tenantId: emp.tenantId },
    select: { id: true, iikoOrderId: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (order.iikoOrderId) {
    return NextResponse.json(
      { error: "Заказ уже отправлен в iiko", iikoOrderId: order.iikoOrderId },
      { status: 400 }
    );
  }

  enqueueIikoOrderDispatch(order.id);
  return NextResponse.json({ ok: true, message: "Заказ поставлен в очередь iiko" });
}
