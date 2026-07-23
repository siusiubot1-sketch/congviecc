import { NextResponse } from "next/server";
import { GMAIL_COOKIE } from "@/lib/gmail";

// Ngắt kết nối: xóa cookie token
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(GMAIL_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
