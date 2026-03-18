/**
 * GET /api/superadmin/tenants/[tenantId]/menu-photos
 * Список фото (библиотека) для подбора изображений блюд.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSuperadmin } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ tenantId: string }> }) {
  const admin = await getSuperadmin();
  if (!admin || admin.type !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { tenantId } = await params;

  const photos = await prisma.menuPhoto.findMany({
    where: { tenantId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, url: true, fileName: true, sortOrder: true, createdAt: true },
  });

  return NextResponse.json({ photos });
}

