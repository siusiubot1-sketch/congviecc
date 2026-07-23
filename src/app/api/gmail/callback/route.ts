import { NextResponse } from "next/server";
import { exchangeCode, GMAIL_COOKIE } from "@/lib/gmail";

// Google gọi lại đây kèm ?code=... — đổi lấy token và lưu vào cookie
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL(`/ket-noi?error=${error ?? "no_code"}`, req.url));
  }

  try {
    const tokens = await exchangeCode(code);
    const res = NextResponse.redirect(new URL("/ket-noi?connected=1", req.url));
    res.cookies.set(GMAIL_COOKIE, JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 ngày
    });
    return res;
  } catch (e) {
    console.error("Gmail OAuth exchange error:", e);
    return NextResponse.redirect(new URL("/ket-noi?error=exchange", req.url));
  }
}
