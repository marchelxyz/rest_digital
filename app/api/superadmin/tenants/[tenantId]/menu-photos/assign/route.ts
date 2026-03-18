/**
 * POST /api/superadmin/tenants/[tenantId]/menu-photos/assign
 * Присвоение фото конкретным блюдам.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSuperadmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenantId: string }> }) {
  const admin = await getSuperadmin();
  if (!admin || admin.type !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { tenantId } = await params;

  const body = (await req.json()) as {
    assignments?: { productId: string; menuPhotoId: string }[];
  };
  const assignments = body.assignments ?? [];
  if (!assignments.length) {
    return NextResponse.json({ error: "assignments обязателен" }, { status: 400 });
  }

  const photoIds = assignments.map((a) => a.menuPhotoId);
  const photos = await prisma.menuPhoto.findMany({
    where: { tenantId, id: { in: photoIds } },
    select: { id: true, url: true },
  });
  const photoById = new Map(photos.map((p) => [p.id, p.url]));

  const tasks = assignments
    .map((a) => {
      const url = photoById.get(a.menuPhotoId);
      if (!url) return null;
      return prisma.product.updateMany({
        where: { id: a.productId, tenantId },
        data: { imageUrl: url },
      });
    })
    .filter(Boolean);

  await prisma.$transaction(tasks as any);

  return NextResponse.json({ ok: true, assigned: assignments.length });
}

