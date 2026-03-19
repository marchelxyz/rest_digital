/**
 * GET/POST /api/restaurant/mailings (tenant-scoped)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEmployee } from "@/lib/auth";

export async function GET() {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const mailings = await prisma.mailing.findMany({
    where: { tenantId: emp.tenantId },
    include: { segment: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(mailings);
}

export async function POST(req: NextRequest) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const mailing = await prisma.mailing.create({
    data: {
      tenantId: emp.tenantId,
      name: body.name ?? "Новая рассылка",
      channel: body.channel ?? "TELEGRAM",
      bodyHtml: body.bodyHtml ?? "",
      bodyPlain: body.bodyPlain ?? null,
      mediaJson: body.mediaJson ? JSON.stringify(body.mediaJson) : null,
      buttonsJson: body.buttonsJson ? JSON.stringify(body.buttonsJson) : null,
      segmentId: body.segmentId ?? null,
      rateLimit: body.rateLimit ?? 50,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
    },
    include: { segment: true },
  });
  return NextResponse.json(mailing);
}
