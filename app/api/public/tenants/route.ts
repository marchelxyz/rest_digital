/**
 * GET /api/public/tenants — список активных тенантов для выбора при входе
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const tenants = await prisma.tenant.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true },
  });
  return NextResponse.json(tenants);
}
