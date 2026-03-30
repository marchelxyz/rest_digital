/**
 * GET /api/cron/iiko-retry
 * Повторная отправка заказов в iiko после сетевых/временных ошибок.
 * Настройте вызов по расписанию (Railway Cron / внешний ping) с заголовком Authorization.
 */
import { NextRequest, NextResponse } from "next/server";
import { processIikoRetryBatch } from "@/lib/iiko/order-dispatch";

function _authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return false;
  }
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) {
    return true;
  }
  const q = req.nextUrl.searchParams.get("secret");
  return q === secret;
}

export async function GET(req: NextRequest) {
  if (!_authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await processIikoRetryBatch();
  return NextResponse.json({ ok: true, ...result });
}
