/**
 * POST /api/restaurant/upload
 * Upload image (PNG/JPEG) -> convert to AVIF -> store in S3.
 * For products, categories, etc.
 */
import { NextRequest, NextResponse } from "next/server";
import { getEmployee } from "@/lib/auth";
import { convertToAvif, isAllowedImageType } from "@/lib/image-avif";
import { uploadToS3 } from "@/lib/s3";
import { randomUUID } from "crypto";

const ALLOWED_FIELDS = ["product", "category", "story", "story_cover"] as const;
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB for stories
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];

export async function POST(req: NextRequest) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const field = formData.get("field") as string | null;
  const file = formData.get("file") as File | null;

  if (!field || !ALLOWED_FIELDS.includes(field as (typeof ALLOWED_FIELDS)[number])) {
    return NextResponse.json(
      { error: `field must be one of: ${ALLOWED_FIELDS.join(", ")}` },
      { status: 400 }
    );
  }
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  const isVideo = field === "story" && ALLOWED_VIDEO_TYPES.includes(file.type);
  const isImage = isAllowedImageType(file.type);
  const valid =
    isVideo ||
    (isImage && ["story", "story_cover", "product", "category"].includes(field));
  if (!valid) {
    const msg =
      field === "story"
        ? "story: PNG/JPEG или MP4/WebM; story_cover: PNG/JPEG"
        : "product/category: нужен PNG или JPEG";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_SIZE;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `Файл слишком большой. Макс ${maxSize / 1024 / 1024} MB` },
      { status: 400 }
    );
  }

  try {
    console.log("[upload] start", {
      field,
      tenantId: emp.tenantId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
    const buffer = Buffer.from(await file.arrayBuffer());
    let url: string;
    if (isVideo) {
      const ext = file.type.includes("webm") ? "webm" : "mp4";
      const key = `tenants/${emp.tenantId}/stories/${randomUUID()}.${ext}`;
      url = await uploadToS3(key, buffer, file.type);
      console.log("[upload] video done", { key, url });
    } else {
      console.log("[upload] converting to AVIF...");
      const avifBuffer = await convertToAvif(buffer);
      console.log("[upload] AVIF done", {
        inputSize: buffer.length,
        outputSize: avifBuffer.length,
      });
      const folder = field === "story" || field === "story_cover" ? "stories" : `${field}s`;
      const key = `tenants/${emp.tenantId}/${folder}/${randomUUID()}.avif`;
      url = await uploadToS3(key, avifBuffer, "image/avif");
      console.log("[upload] image done", { key, url });
    }
    return NextResponse.json({ url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    console.error("[upload] error", { field, error: msg, stack: e instanceof Error ? e.stack : undefined });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
