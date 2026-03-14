/**
 * GET /api/restaurant/stats?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Статистика по заведению: заказы и контакты (база).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEmployee } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultTo = new Date(now);
  const from = fromParam ? new Date(fromParam) : defaultFrom;
  const to = toParam ? new Date(toParam) : defaultTo;

  const whereBase = {
    tenantId: emp.tenantId,
    createdAt: { gte: from, lte: to },
  };

  const [
    ordersByStatus,
    ordersByType,
    ordersByPlatform,
    ordersByUtmSource,
    customersCount,
    customersByPlatform,
    customersByUtmSource,
    totalOrders,
    totalOrdersAmount,
  ] = await Promise.all([
    prisma.order.groupBy({
      by: ["status"],
      where: whereBase,
      _count: { id: true },
      _sum: { totalAmount: true },
    }),
    prisma.order.groupBy({
      by: ["type"],
      where: whereBase,
      _count: { id: true },
      _sum: { totalAmount: true },
    }),
    prisma.order.groupBy({
      by: ["platform"],
      where: whereBase,
      _count: { id: true },
      _sum: { totalAmount: true },
    }),
    prisma.order.groupBy({
      by: ["utmSource"],
      where: { ...whereBase, utmSource: { not: null } },
      _count: { id: true },
      _sum: { totalAmount: true },
    }),
    prisma.customer.count({ where: { tenantId: emp.tenantId, createdAt: whereBase.createdAt } }),
    prisma.customer.groupBy({
      by: ["platform"],
      where: { tenantId: emp.tenantId, createdAt: whereBase.createdAt, platform: { not: null } },
      _count: { id: true },
    }),
    prisma.customer.groupBy({
      by: ["utmSource"],
      where: { tenantId: emp.tenantId, createdAt: whereBase.createdAt, utmSource: { not: null } },
      _count: { id: true },
    }),
    prisma.order.count({ where: whereBase }),
    prisma.order.aggregate({ where: whereBase, _sum: { totalAmount: true } }),
  ]);

  const byStatus = Object.fromEntries(
    ordersByStatus.map((o) => [o.status, { count: o._count.id, sum: Number(o._sum.totalAmount ?? 0) }])
  );
  const byType = Object.fromEntries(
    ordersByType.map((o) => [o.type ?? "unknown", { count: o._count.id, sum: Number(o._sum.totalAmount ?? 0) }])
  );
  const byPlatform = Object.fromEntries(
    ordersByPlatform.map((o) => [
      o.platform ?? "standalone",
      { count: o._count.id, sum: Number(o._sum.totalAmount ?? 0) },
    ])
  );
  const byUtmSource = Object.fromEntries(
    ordersByUtmSource.map((o) => [o.utmSource ?? "direct", { count: o._count.id, sum: Number(o._sum.totalAmount ?? 0) }])
  );
  const contactsByPlatform = Object.fromEntries(
    customersByPlatform.map((c) => [c.platform ?? "unknown", c._count.id])
  );
  const contactsByUtmSource = Object.fromEntries(
    customersByUtmSource.map((c) => [c.utmSource ?? "direct", c._count.id])
  );

  return NextResponse.json({
    period: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) },
    orders: {
      total: totalOrders,
      totalAmount: Number(totalOrdersAmount._sum.totalAmount ?? 0),
      byStatus,
      byType,
      byPlatform,
      byUtmSource,
    },
    contacts: {
      total: customersCount,
      byPlatform: contactsByPlatform,
      byUtmSource: contactsByUtmSource,
    },
  });
}
