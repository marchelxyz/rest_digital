/**
 * GET /api/public/menu/[slug] — меню для клиентского приложения
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug, isActive: true },
  });
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const categories = await prisma.category.findMany({
    where: { tenantId: tenant.id, isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { isActive: true, isAvailable: true },
        orderBy: { sortOrder: "asc" },
        include: {
          modifierGroups: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            include: {
              options: {
                where: { isActive: true },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
          productBadges: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
  return NextResponse.json(categories);
}
