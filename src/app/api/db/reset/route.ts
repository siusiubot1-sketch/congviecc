import { NextResponse } from "next/server";
import { resetDemo } from "@/lib/db-helpers";

// Khôi phục dữ liệu mẫu: POST /api/db/reset
export async function POST() {
  try {
    await resetDemo();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DB reset error:", e);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
