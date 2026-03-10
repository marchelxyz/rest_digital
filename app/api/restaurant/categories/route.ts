/**
 * GET/POST /api/restaurant/categories (tenant-scoped)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEmployee } from "@/lib/auth";

export async function GET() {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const list = await prisma.category.findMany({
    where: { tenantId: emp.tenantId },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { name?: string; sortOrder?: number };
  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "name обязателен" }, { status: 400 });
  const cat = await prisma.category.create({
    data: {
      tenantId: emp.tenantId,
      name,
      sortOrder: body.sortOrder ?? 0,
    },
  });
  return NextResponse.json(cat);
}
