/**
 * Yandex Object Storage (S3-compatible) client for uploading files.
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const bucket = process.env.YANDEX_S3_BUCKET;
const region = process.env.YANDEX_S3_REGION ?? "ru-central1";
const endpoint = process.env.YANDEX_S3_ENDPOINT ?? "https://storage.yandexcloud.net";
const publicUrl = process.env.YANDEX_S3_PUBLIC_URL ?? `https://storage.yandexcloud.net/${bucket}`;

function getClient(): S3Client | null {
  if (!process.env.YANDEX_S3_ACCESS_KEY_ID || !process.env.YANDEX_S3_SECRET_ACCESS_KEY || !bucket) {
    return null;
  }
  return new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId: process.env.YANDEX_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.YANDEX_S3_SECRET_ACCESS_KEY,
    },
  });
}

/**
 * Checks if S3 is configured.
 */
export function isS3Configured(): boolean {
  return getClient() !== null;
}

/**
 * Uploads buffer to S3 and returns public URL.
 * @param key - Object key (path) in bucket
 * @param body - File content (AVIF buffer)
 * @param contentType - MIME type (image/avif)
 */
export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const client = getClient();
  if (!client) {
    throw new Error("S3 is not configured. Set YANDEX_S3_* env variables.");
  }
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return `${publicUrl.replace(/\/$/, "")}/${key}`;
}
