/**
 * GET/POST /api/restaurant/mailing-segments (tenant-scoped)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEmployee } from "@/lib/auth";

export async function GET() {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const segments = await prisma.mailingSegment.findMany({
    where: { tenantId: emp.tenantId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(segments);
}

export async function POST(req: NextRequest) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const segment = await prisma.mailingSegment.create({
    data: {
      tenantId: emp.tenantId,
      name: body.name ?? "Новый сегмент",
      description: body.description ?? null,
      ageFrom: body.ageFrom ?? null,
      ageTo: body.ageTo ?? null,
      platforms: body.platforms ? JSON.stringify(body.platforms) : null,
      avgCheckFrom: body.avgCheckFrom ?? null,
      avgCheckTo: body.avgCheckTo ?? null,
      categoryIds: body.categoryIds ? JSON.stringify(body.categoryIds) : null,
      maxMessagesPerHour: body.maxMessagesPerHour ?? 50,
    },
  });
  return NextResponse.json(segment);
}
