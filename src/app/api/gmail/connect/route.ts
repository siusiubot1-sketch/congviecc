import { NextResponse } from "next/server";
import { getAuthUrl, isConfigured } from "@/lib/gmail";

// Bắt đầu luồng OAuth: chuyển hướng người dùng tới trang đồng ý của Google
export async function GET(req: Request) {
  if (!isConfigured()) {
    return NextResponse.redirect(new URL("/ket-noi?error=config", req.url));
  }
  return NextResponse.redirect(getAuthUrl());
}
