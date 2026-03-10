/**
 * POST /api/restaurant/categories/bulk
 * Body: { ids: string[]; action: 'hide' | 'show' | 'publish' | 'unpublish' }
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
    ids?: string[];
    action?: "hide" | "show" | "publish" | "unpublish";
  };
  const { ids, action } = body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids[] обязателен" }, { status: 400 });
  }
  const validActions = ["hide", "show", "publish", "unpublish"];
  if (!action || !validActions.includes(action)) {
    return NextResponse.json({ error: "action обязателен: hide, show, publish, unpublish" }, { status: 400 });
  }
  const where = { id: { in: ids }, tenantId: emp.tenantId };
  const count = await prisma.category.count({ where });
  if (count !== ids.length) {
    return NextResponse.json({ error: "Некоторые категории не найдены" }, { status: 400 });
  }
  const data: Record<string, unknown> = {};
  if (action === "hide") data.isActive = false;
  if (action === "show") data.isActive = true;
  if (action === "publish") data.isPublished = true;
  if (action === "unpublish") data.isPublished = false;
  await prisma.category.updateMany({ where, data: data as never });
  return NextResponse.json({ ok: true, count: ids.length });
}
