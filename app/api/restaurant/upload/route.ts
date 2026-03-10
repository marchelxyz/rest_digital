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

const ALLOWED_FIELDS = ["product", "category"] as const;
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

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
  if (!isAllowedImageType(file.type)) {
    return NextResponse.json(
      { error: "Only PNG and JPEG images are allowed" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: `File too large. Max ${MAX_SIZE / 1024 / 1024} MB` },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const avifBuffer = await convertToAvif(buffer);
    const ext = "avif";
    const key = `tenants/${emp.tenantId}/${field}s/${randomUUID()}.${ext}`;
    const url = await uploadToS3(key, avifBuffer, "image/avif");
    return NextResponse.json({ url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
