/**
 * POST /api/webhooks/iiko
 * Вебхук для получения обновлений статусов заказов из iiko.
 * URL настраивается в iikoWeb: Настройки Cloud API → Вебхуки.
 * Документация: https://ru.iiko.help
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const STATUS_MAP: Record<string, "NEW" | "PREPARING" | "IN_DELIVERY" | "COMPLETED" | "CANCELLED"> = {
  Unconfirmed: "NEW",
  WaitCooking: "PREPARING",
  ReadyForCooking: "PREPARING",
  CookingStarted: "PREPARING",
  CookingCompleted: "PREPARING",
  Waiting: "PREPARING",
  Closed: "COMPLETED",
  Cancelled: "CANCELLED",
  Delivered: "COMPLETED",
  OnWay: "IN_DELIVERY",
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      organizationId?: string;
      orderId?: string;
      eventType?: string;
      status?: string;
      deliveryStatus?: string;
    };
    const orderId = body.orderId;
    const status = body.status ?? body.deliveryStatus;
    if (!orderId || !status) {
      return NextResponse.json({ received: true }, { status: 200 });
    }
    const ourStatus = STATUS_MAP[status];
    if (!ourStatus) {
      return NextResponse.json({ received: true }, { status: 200 });
    }
    const updated = await prisma.order.updateMany({
      where: { iikoOrderId: orderId },
      data: { status: ourStatus },
    });
    if (updated.count > 0) {
      console.log("[iiko webhook] order", orderId, "->", ourStatus);
    }
  } catch {
    // ignore
  }
  return NextResponse.json({ received: true }, { status: 200 });
}
