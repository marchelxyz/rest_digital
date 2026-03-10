/**
 * Converts image buffer (PNG/JPEG) to AVIF format with compression.
 */
import sharp from "sharp";

const AVIF_QUALITY = 80;
const AVIF_EFFORT = 4;

const ALLOWED_MIMES = ["image/png", "image/jpeg", "image/jpg"];

export function isAllowedImageType(mime: string): boolean {
  return ALLOWED_MIMES.includes(mime);
}

/**
 * Converts input buffer to AVIF. Accepts PNG or JPEG.
 */
export async function convertToAvif(input: Buffer): Promise<Buffer> {
  const pipeline = sharp(input);
  const meta = await pipeline.metadata();
  const format = meta.format;
  if (format && !["png", "jpeg", "jpg"].includes(format)) {
    throw new Error(`Unsupported format: ${format}. Use PNG or JPEG.`);
  }
  return pipeline
    .avif({ quality: AVIF_QUALITY, effort: AVIF_EFFORT })
    .toBuffer();
}
