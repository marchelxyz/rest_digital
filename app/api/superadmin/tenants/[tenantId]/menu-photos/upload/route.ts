/**
 * POST /api/superadmin/tenants/[tenantId]/menu-photos/upload
 * Массовая загрузка фото блюд в библиотеку (без присвоения конкретным блюдам).
 */
import { NextRequest, NextResponse } from "next/server";
import { getSuperadmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { convertToAvif, isAllowedImageType } from "@/lib/image-avif";
import { uploadToS3 } from "@/lib/s3";
import { randomUUID } from "crypto";

const MAX_MB = 10; // на файл
const ALLOWED_ACCEPT = ["image/png", "image/jpeg", "image/jpg"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenantId: string }> }) {
  const admin = await getSuperadmin();
  if (!admin || admin.type !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tenantId } = await params;

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];
  if (!files.length) {
    return NextResponse.json({ error: "files обязателен (несколько изображений)" }, { status: 400 });
  }

  const created: { id: string; url: string; fileName: string }[] = [];

  for (const file of files) {
    if (!(file instanceof File)) continue;
    if (!ALLOWED_ACCEPT.includes(file.type)) {
      return NextResponse.json({ error: `Недопустимый тип: ${file.type}` }, { status: 400 });
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      return NextResponse.json({ error: `Слишком большой файл: ${file.name}` }, { status: 400 });
    }
    if (!isAllowedImageType(file.type)) {
      return NextResponse.json({ error: `Только PNG/JPEG` }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const avifBuffer = await convertToAvif(buffer);
    const id = randomUUID();
    const ext = "avif";
    const key = `tenants/${tenantId}/menu-photos/${id}.${ext}`;
    const url = await uploadToS3(key, avifBuffer, "image/avif");

    await prisma.menuPhoto.create({
      data: {
        tenantId,
        id,
        url,
        fileName: file.name,
        sortOrder: 0,
      },
    });

    created.push({ id, url, fileName: file.name });
  }

  return NextResponse.json({ photos: created });
}

