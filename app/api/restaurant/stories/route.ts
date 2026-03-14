/**
 * GET/POST /api/restaurant/stories (tenant-scoped)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEmployee } from "@/lib/auth";

export async function GET() {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const list = await prisma.story.findMany({
    where: { tenantId: emp.tenantId },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as {
    title?: string;
    coverUrl?: string | null;
    mediaUrl?: string;
    mediaType?: "image" | "video";
    linkUrl?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  };
  const title = body.title?.trim();
  const mediaUrl = body.mediaUrl?.trim();
  if (!title || !mediaUrl) {
    return NextResponse.json({ error: "title и mediaUrl обязательны" }, { status: 400 });
  }
  const mediaType = body.mediaType === "video" ? "video" : "image";
  const story = await prisma.story.create({
    data: {
      tenantId: emp.tenantId,
      title,
      coverUrl: body.coverUrl?.trim() || null,
      mediaUrl,
      mediaType,
      linkUrl: body.linkUrl?.trim() || null,
      sortOrder: body.sortOrder ?? 0,
      isActive: body.isActive ?? true,
    },
  });
  return NextResponse.json(story);
}
