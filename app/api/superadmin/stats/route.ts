/**
 * GET /api/superadmin/stats?tenantIds=id1,id2&from=YYYY-MM-DD&to=YYYY-MM-DD
 * tenantIds — опционально, через запятую. Если не указан — все заведения.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSuperadmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const admin = await getSuperadmin();
  if (!admin || admin.type !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const tenantIdsParam = searchParams.get("tenantIds");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const tenantIds = tenantIdsParam ? tenantIdsParam.split(",").map((s) => s.trim()).filter(Boolean) : null;

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultTo = new Date(now);
  const from = fromParam ? new Date(fromParam) : defaultFrom;
  const to = toParam ? new Date(toParam) : defaultTo;

  const whereBase = {
    ...(tenantIds && tenantIds.length > 0 ? { tenantId: { in: tenantIds } } : {}),
    createdAt: { gte: from, lte: to },
  };

  const [orders, ordersByPlatform, ordersByUtmSource, customers, customersByPlatform, customersByUtmSource] =
    await Promise.all([
      prisma.order.groupBy({
        by: ["tenantId", "status", "type"],
        where: whereBase,
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      prisma.order.groupBy({
        by: ["tenantId", "platform"],
        where: whereBase,
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      prisma.order.groupBy({
        by: ["tenantId", "utmSource"],
        where: { ...whereBase, utmSource: { not: null } },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      prisma.customer.groupBy({
        by: ["tenantId"],
        where: whereBase,
        _count: { id: true },
      }),
      prisma.customer.groupBy({
        by: ["tenantId", "platform"],
        where: { ...whereBase, platform: { not: null } },
        _count: { id: true },
      }),
      prisma.customer.groupBy({
        by: ["tenantId", "utmSource"],
        where: { ...whereBase, utmSource: { not: null } },
        _count: { id: true },
      }),
    ]);

  const tenants = await prisma.tenant.findMany({
    ...(tenantIds && tenantIds.length > 0 ? { where: { id: { in: tenantIds } } } : {}),
    select: { id: true, name: true, slug: true },
  });

  const totalOrders = await prisma.order.count({ where: whereBase });
  const totalOrdersAmount = await prisma.order.aggregate({
    where: whereBase,
    _sum: { totalAmount: true },
  });

  const byTenant: Record<string, { name: string; slug: string; orders: number; ordersAmount: number; contacts: number; byPlatform: Record<string, number>; byUtmSource: Record<string, number> }> = {};
  for (const t of tenants) {
    byTenant[t.id] = {
      name: t.name,
      slug: t.slug,
      orders: 0,
      ordersAmount: 0,
      contacts: 0,
      byPlatform: {},
      byUtmSource: {},
    };
  }

  for (const o of orders) {
    if (byTenant[o.tenantId]) {
      byTenant[o.tenantId].orders += o._count.id;
      byTenant[o.tenantId].ordersAmount += Number(o._sum.totalAmount ?? 0);
    }
  }
  for (const o of ordersByPlatform) {
    if (byTenant[o.tenantId]) {
      byTenant[o.tenantId].byPlatform[o.platform ?? "standalone"] = (byTenant[o.tenantId].byPlatform[o.platform ?? "standalone"] ?? 0) + o._count.id;
    }
  }
  for (const o of ordersByUtmSource) {
    if (byTenant[o.tenantId]) {
      byTenant[o.tenantId].byUtmSource[o.utmSource ?? "direct"] = (byTenant[o.tenantId].byUtmSource[o.utmSource ?? "direct"] ?? 0) + o._count.id;
    }
  }
  for (const c of customers) {
    if (byTenant[c.tenantId]) byTenant[c.tenantId].contacts += c._count.id;
  }
  for (const c of customersByPlatform) {
    if (byTenant[c.tenantId]) {
      byTenant[c.tenantId].byPlatform[c.platform ?? "unknown"] = (byTenant[c.tenantId].byPlatform[c.platform ?? "unknown"] ?? 0) + c._count.id;
    }
  }
  for (const c of customersByUtmSource) {
    if (byTenant[c.tenantId]) {
      byTenant[c.tenantId].byUtmSource[c.utmSource ?? "direct"] = (byTenant[c.tenantId].byUtmSource[c.utmSource ?? "direct"] ?? 0) + c._count.id;
    }
  }

  return NextResponse.json({
    period: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) },
    tenants: tenants.map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
    summary: {
      orders: totalOrders,
      ordersAmount: Number(totalOrdersAmount._sum.totalAmount ?? 0),
      contacts: customers.reduce((s, c) => s + c._count.id, 0),
    },
    byTenant,
  });
}
