import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    tenantId?: string;
    maxUserId?: string;
    token?: string;
  };
  const tenantId = body.tenantId?.trim();
  const maxUserId = body.maxUserId?.trim();
  const token = body.token?.trim();

  if (!tenantId || !maxUserId || !token) {
    console.log("[max-bind-complete] missing fields", {
      tenantIdPresent: !!tenantId,
      maxUserIdPresent: !!maxUserId,
      tokenPresent: !!token,
    });
    return NextResponse.json({ error: "tenantId, maxUserId и token обязательны" }, { status: 400 });
  }

  const bind = await prisma.maxBindToken.findFirst({
    where: {
      tenantId,
      token,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!bind) {
    console.log("[max-bind-complete] bind token not found or expired", {
      tenantId,
      tokenSuffix: token.slice(-6),
    });
    return NextResponse.json({ error: "Токен недействителен или истёк" }, { status: 400 });
  }

  const customer = await prisma.customer.findFirst({
    where: { id: bind.customerId, tenantId },
  });
  if (!customer) {
    console.log("[max-bind-complete] customer for bind not found", {
      tenantId,
      customerId: bind.customerId,
    });
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.customer.update({
      where: { id: customer.id },
      data: { maxUserId },
    }),
    prisma.maxBindToken.update({
      where: { id: bind.id },
      data: { usedAt: new Date() },
    }),
  ]);

  console.log("[max-bind-complete] success", {
    tenantId,
    customerId: customer.id,
    maxUserId,
    tokenSuffix: token.slice(-6),
  });

  return NextResponse.json({ ok: true });
}

