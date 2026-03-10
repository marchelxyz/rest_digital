/**
 * GET /api/restaurant/orders (tenant-scoped)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEmployee } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const status = req.nextUrl.searchParams.get("status");
  const list = await prisma.order.findMany({
    where: {
      tenantId: emp.tenantId,
      ...(status && { status: status as "NEW" | "PREPARING" | "IN_DELIVERY" | "COMPLETED" | "CANCELLED" }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  });
  return NextResponse.json(list);
}
