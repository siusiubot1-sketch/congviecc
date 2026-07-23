import { NextResponse } from "next/server";
import { loadAll } from "@/lib/db-helpers";

export const dynamic = "force-dynamic";

// Lấy toàn bộ dữ liệu (tự seed lần đầu)
export async function GET() {
  try {
    const data = await loadAll();
    return NextResponse.json(data);
  } catch (e) {
    console.error("DB load error:", e);
    return NextResponse.json({ error: "db_error", detail: String(e) }, { status: 500 });
  }
}
