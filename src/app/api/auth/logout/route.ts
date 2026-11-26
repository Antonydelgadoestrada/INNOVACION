import { clearSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST() {
  await clearSession();
  return NextResponse.json({ success: true, message: "Sesión cerrada correctamente" });
}

export async function GET(req: NextRequest) {
  await clearSession();
  const loginUrl = new URL("/auth/login", req.url);
  return NextResponse.redirect(loginUrl);
}
