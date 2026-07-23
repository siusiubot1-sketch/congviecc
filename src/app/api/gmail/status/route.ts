import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { GMAIL_COOKIE, isConfigured, getProfileEmail } from "@/lib/gmail";

// Trạng thái kết nối: đã cấu hình credential chưa? đã kết nối tài khoản chưa?
export async function GET() {
  const configured = isConfigured();
  const store = await cookies();
  const raw = store.get(GMAIL_COOKIE)?.value;

  if (!raw) return NextResponse.json({ configured, connected: false });

  try {
    const tokens = JSON.parse(raw);
    const email = await getProfileEmail(tokens);
    return NextResponse.json({ configured, connected: true, email });
  } catch {
    return NextResponse.json({ configured, connected: false });
  }
}
