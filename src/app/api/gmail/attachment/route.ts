import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { GMAIL_COOKIE, getAttachment } from "@/lib/gmail";

// Phục vụ tệp đính kèm Gmail:
// /api/gmail/attachment?messageId=..&attachmentId=..&mime=..&filename=..&download=1
export async function GET(req: Request) {
  const store = await cookies();
  const raw = store.get(GMAIL_COOKIE)?.value;
  if (!raw) return new NextResponse("not_connected", { status: 401 });

  const url = new URL(req.url);
  const messageId = url.searchParams.get("messageId");
  const attachmentId = url.searchParams.get("attachmentId");
  const mime = url.searchParams.get("mime") || "application/octet-stream";
  const filename = url.searchParams.get("filename") || "tep-dinh-kem";
  const download = url.searchParams.get("download");

  if (!messageId || !attachmentId) {
    return new NextResponse("missing_params", { status: 400 });
  }

  try {
    const tokens = JSON.parse(raw);
    const buf = await getAttachment(tokens, messageId, attachmentId);
    const disposition = download ? "attachment" : "inline";
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    console.error("Gmail attachment error:", e);
    return new NextResponse("fetch_failed", { status: 500 });
  }
}
