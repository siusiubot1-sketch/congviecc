import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { GMAIL_COOKIE, listMessages } from "@/lib/gmail";

// Lấy danh sách mail gần đây từ hộp thư đến
export async function GET(req: Request) {
  const store = await cookies();
  const raw = store.get(GMAIL_COOKIE)?.value;
  if (!raw) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q") ?? "in:inbox";

  try {
    const tokens = JSON.parse(raw);
    const messages = await listMessages(tokens, 15, q);
    return NextResponse.json({ messages });
  } catch (e) {
    console.error("Gmail list error:", e);
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }
}
