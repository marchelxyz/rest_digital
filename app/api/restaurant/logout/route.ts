import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { EMPLOYEE_COOKIE } from "@/lib/auth";

export async function POST() {
  const c = await cookies();
  c.delete(EMPLOYEE_COOKIE);
  return NextResponse.json({ ok: true });
}
