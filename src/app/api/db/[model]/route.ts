import { NextResponse } from "next/server";
import { delegateFor } from "@/lib/db-helpers";

// Tạo mới 1 bản ghi: POST /api/db/[model]  body = object đầy đủ (có field id)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ model: string }> }
) {
  const { model } = await params;
  const delegate = delegateFor(model);
  if (!delegate) return NextResponse.json({ error: "unknown_model" }, { status: 404 });

  try {
    const obj = await req.json();
    if (!obj?.id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
    await delegate.upsert({
      where: { id: obj.id },
      create: { id: obj.id, data: obj },
      update: { data: obj },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DB create error:", e);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
