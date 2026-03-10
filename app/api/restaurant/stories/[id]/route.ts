/**
 * PATCH/DELETE /api/restaurant/stories/[id]
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEmployee } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await req.json()) as {
    title?: string;
    coverUrl?: string | null;
    mediaUrl?: string;
    mediaType?: "image" | "video";
    sortOrder?: number;
    isActive?: boolean;
  };
  const data: Record<string, unknown> = {};
  if (body.title != null) data.title = body.title.trim();
  if (body.coverUrl !== undefined) data.coverUrl = body.coverUrl?.trim() || null;
  if (body.mediaUrl != null) data.mediaUrl = body.mediaUrl.trim();
  if (body.mediaType != null) data.mediaType = body.mediaType === "video" ? "video" : "image";
  if (body.sortOrder != null) data.sortOrder = body.sortOrder;
  if (body.isActive != null) data.isActive = body.isActive;
  const updated = await prisma.story.updateMany({
    where: { id, tenantId: emp.tenantId },
    data: data as never,
  });
  if (updated.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const story = await prisma.story.findUnique({ where: { id } });
  return NextResponse.json(story);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const deleted = await prisma.story.deleteMany({ where: { id, tenantId: emp.tenantId } });
  if (deleted.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
