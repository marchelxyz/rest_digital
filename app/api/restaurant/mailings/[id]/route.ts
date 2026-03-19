/**
 * GET/PATCH/DELETE /api/restaurant/mailings/[id] (tenant-scoped)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEmployee } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const mailing = await prisma.mailing.findFirst({
    where: { id, tenantId: emp.tenantId },
    include: { segment: true },
  });
  if (!mailing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(mailing);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const existing = await prisma.mailing.findFirst({
    where: { id, tenantId: emp.tenantId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await req.json();
  const updated = await prisma.mailing.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.channel !== undefined && { channel: body.channel }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.bodyHtml !== undefined && { bodyHtml: body.bodyHtml }),
      ...(body.bodyPlain !== undefined && { bodyPlain: body.bodyPlain }),
      ...(body.mediaJson !== undefined && {
        mediaJson: JSON.stringify(body.mediaJson),
      }),
      ...(body.buttonsJson !== undefined && {
        buttonsJson: JSON.stringify(body.buttonsJson),
      }),
      ...(body.segmentId !== undefined && { segmentId: body.segmentId }),
      ...(body.rateLimit !== undefined && { rateLimit: body.rateLimit }),
      ...(body.scheduledAt !== undefined && {
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      }),
    },
    include: { segment: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const existing = await prisma.mailing.findFirst({
    where: { id, tenantId: emp.tenantId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.mailing.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
