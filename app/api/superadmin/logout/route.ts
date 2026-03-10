import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SUPERADMIN_COOKIE } from "@/lib/auth";

export async function POST() {
  const c = await cookies();
  c.delete(SUPERADMIN_COOKIE);
  return NextResponse.json({ ok: true });
}
