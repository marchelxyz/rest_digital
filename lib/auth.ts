/**
 * Простая auth для Superadmin и Employee.
 * В production заменить на NextAuth или аналог.
 */
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const SUPERADMIN_COOKIE = "rest_superadmin";
const EMPLOYEE_COOKIE = "rest_employee";

export type AuthUser =
  | { type: "superadmin"; id: string; email: string; name: string }
  | { type: "employee"; id: string; tenantId: string; email: string; name: string; role: string };

/**
 * Хеширует пароль.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Проверяет пароль.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Возвращает текущего Superadmin из cookies.
 */
export async function getSuperadmin(): Promise<AuthUser | null> {
  const c = await cookies();
  const id = c.get(SUPERADMIN_COOKIE)?.value;
  if (!id) return null;
  const admin = await prisma.superadmin.findUnique({ where: { id } });
  if (!admin) return null;
  return { type: "superadmin", id: admin.id, email: admin.email, name: admin.name };
}

/**
 * Возвращает текущего Employee из cookies.
 */
export async function getEmployee(): Promise<AuthUser | null> {
  const c = await cookies();
  const payload = c.get(EMPLOYEE_COOKIE)?.value;
  if (!payload) return null;
  try {
    const { id } = JSON.parse(payload) as { id: string; tenantId: string };
    const emp = await prisma.employee.findUnique({
      where: { id },
      include: { tenant: true },
    });
    if (!emp) return null;
    return {
      type: "employee",
      id: emp.id,
      tenantId: emp.tenantId,
      email: emp.email,
      name: emp.name,
      role: emp.role,
    };
  } catch {
    return null;
  }
}

export { SUPERADMIN_COOKIE, EMPLOYEE_COOKIE };
