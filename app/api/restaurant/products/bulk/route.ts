/**
 * POST /api/restaurant/products/bulk
 * Body: { ids: string[]; action: 'hide' | 'show' | 'move' | 'delete' | 'publish' | 'unpublish'; categoryId?: string }
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
    action?: "hide" | "show" | "move" | "delete" | "publish" | "unpublish";
    categoryId?: string;
  };
  const { ids, action, categoryId } = body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids[] обязателен" }, { status: 400 });
  }
  const validActions = ["hide", "show", "move", "delete", "publish", "unpublish"];
  if (!action || !validActions.includes(action)) {
    return NextResponse.json({ error: "action обязателен: hide, show, move, delete, publish, unpublish" }, { status: 400 });
  }
  if (action === "move" && !categoryId) {
    return NextResponse.json({ error: "categoryId обязателен для move" }, { status: 400 });
  }
  const where = { id: { in: ids }, tenantId: emp.tenantId };
  const count = await prisma.product.count({ where });
  if (count !== ids.length) {
    return NextResponse.json({ error: "Некоторые блюда не найдены" }, { status: 400 });
  }
  if (action === "move" && categoryId) {
    const cat = await prisma.category.findFirst({
      where: { id: categoryId, tenantId: emp.tenantId },
    });
    if (!cat) {
      return NextResponse.json({ error: "Категория не найдена" }, { status: 400 });
    }
  }
  const data: Record<string, unknown> = {};
  if (action === "hide") data.isActive = false;
  if (action === "show") data.isActive = true;
  if (action === "move" && categoryId) data.categoryId = categoryId;
  if (action === "publish") data.isPublished = true;
  if (action === "unpublish") data.isPublished = false;
  if (action === "delete") {
    await prisma.product.deleteMany({ where });
  } else {
    await prisma.product.updateMany({ where, data: data as never });
  }
  return NextResponse.json({ ok: true, count: ids.length });
}
