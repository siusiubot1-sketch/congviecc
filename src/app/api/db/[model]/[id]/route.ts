import { NextResponse } from "next/server";
import { delegateFor } from "@/lib/db-helpers";

// Cập nhật: PUT /api/db/[model]/[id]  body = object đầy đủ sau khi sửa
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ model: string; id: string }> }
) {
  const { model, id } = await params;
  const delegate = delegateFor(model);
  if (!delegate) return NextResponse.json({ error: "unknown_model" }, { status: 404 });

  try {
    const obj = await req.json();
    await delegate.upsert({
      where: { id },
      create: { id, data: obj },
      update: { data: obj },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DB update error:", e);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}

// Xóa: DELETE /api/db/[model]/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ model: string; id: string }> }
) {
  const { model, id } = await params;
  const delegate = delegateFor(model);
  if (!delegate) return NextResponse.json({ error: "unknown_model" }, { status: 404 });

  try {
    await delegate.delete({ where: { id } }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DB delete error:", e);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
