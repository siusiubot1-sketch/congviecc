import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { GMAIL_COOKIE, sendMessage } from "@/lib/gmail";

// Gửi email qua Gmail API
export async function POST(req: Request) {
  const store = await cookies();
  const raw = store.get(GMAIL_COOKIE)?.value;
  if (!raw) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  const { to, subject, body } = await req.json().catch(() => ({}));
  if (!to || !subject || !body) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  try {
    const tokens = JSON.parse(raw);
    const id = await sendMessage(tokens, to, subject, body);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error("Gmail send error:", e);
    return NextResponse.json({ error: "send_failed" }, { status: 500 });
  }
}
