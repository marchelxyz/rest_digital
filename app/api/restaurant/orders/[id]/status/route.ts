/**
 * PATCH /api/restaurant/orders/[id]/status
 * Бонусы на карту лояльности начисляются при подтверждении заказа (PREPARING или COMPLETED).
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
  const newStatus = body.status;
  if (!newStatus || !STATUSES.includes(newStatus as (typeof STATUSES)[number])) {
    return NextResponse.json({ error: "Неверный status" }, { status: 400 });
  }

  const existing = await prisma.order.findUnique({
    where: { id, tenantId: emp.tenantId },
    include: { customer: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.order.update({
    where: { id },
    data: { status: newStatus as (typeof STATUSES)[number] },
  });

  const confirmsOrder = newStatus === "PREPARING" || newStatus === "COMPLETED";
  const wasNew = existing.status === "NEW";
  if (confirmsOrder && wasNew && existing.customerId) {
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: emp.tenantId },
    });
    const cashbackPct = settings ? Number(settings.loyaltyCashbackPct) : 0;
    const pointsToAdd = (Number(existing.totalAmount) * cashbackPct) / 100;

    const updatedCustomer = await prisma.customer.update({
      where: { id: existing.customerId },
      data: {
        stamps: { increment: 1 },
        points: { increment: pointsToAdd },
      },
    });

    // Реферальные бонусы: только за первый завершённый заказ приглашённого
    if (settings && settings.referralBonusPoints > 0 || settings?.referralBonusStamps) {
      const hasCompletedBefore = await prisma.order.findFirst({
        where: {
          tenantId: emp.tenantId,
          customerId: existing.customerId,
          status: "COMPLETED",
          id: { not: existing.id },
        },
        select: { id: true },
      });

      if (!hasCompletedBefore && updatedCustomer.invitedByCustomerId) {
        const bonusPoints = Number(settings.referralBonusPoints ?? 0);
        const bonusStamps = settings.referralBonusStamps ?? 0;

        await prisma.$transaction([
          prisma.customer.update({
            where: { id: updatedCustomer.id },
            data: {
              points: bonusPoints ? { increment: bonusPoints } : undefined,
              stamps: bonusStamps ? { increment: bonusStamps } : undefined,
            },
          }),
          prisma.customer.update({
            where: { id: updatedCustomer.invitedByCustomerId },
            data: {
              points: bonusPoints ? { increment: bonusPoints } : undefined,
              stamps: bonusStamps ? { increment: bonusStamps } : undefined,
            },
          }),
        ]);
      }
    }
  }

  const updated = await prisma.order.findUnique({
    where: { id },
    include: { customer: true, items: { include: { product: true } } },
  });
  return NextResponse.json(updated);
}
