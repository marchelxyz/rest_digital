/**
 * POST /api/restaurant/login
 * Body: { tenantId, email, password }
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { tenantId, email, password } = (await req.json()) as {
      tenantId?: string;
      email?: string;
      password?: string;
    };
    if (!tenantId || !email || !password) {
      return NextResponse.json(
        { error: "tenantId, email и пароль обязательны" },
        { status: 400 }
      );
    }
    const emp = await prisma.employee.findUnique({
      where: { tenantId_email: { tenantId, email } },
    });
    if (!emp || !(await verifyPassword(password, emp.passwordHash))) {
      return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
    }
    const c = await cookies();
    c.set(
      "rest_employee",
      JSON.stringify({ id: emp.id, tenantId: emp.tenantId }),
      { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7 }
    );
    return NextResponse.json({ ok: true, name: emp.name });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
