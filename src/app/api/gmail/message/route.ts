import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { GMAIL_COOKIE, getMessage } from "@/lib/gmail";

// Lấy nội dung đầy đủ của 1 mail: /api/gmail/message?id=...
export async function GET(req: Request) {
  const store = await cookies();
  const raw = store.get(GMAIL_COOKIE)?.value;
  if (!raw) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  try {
    const tokens = JSON.parse(raw);
    const message = await getMessage(tokens, id);
    return NextResponse.json({ message });
  } catch (e) {
    console.error("Gmail get message error:", e);
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }
}
