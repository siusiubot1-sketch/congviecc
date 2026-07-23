"use client";

import { useState } from "react";
import type { Brand, BrandStage } from "@/lib/types";
import { users } from "@/lib/mock-data";
import { STAGE_META, cn } from "@/lib/utils";
import { useData } from "./DataProvider";
import { IconClose } from "./icons";

const STAGES: BrandStage[] = ["lead", "dealing", "won", "lost"];

export default function AddBrandModal({
  open,
  onClose,
  onCreated,
  defaults,
  editBrand,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (brand: Brand) => void;
  defaults?: Partial<{ name: string; contactEmail: string; contactName: string }>;
  editBrand?: Brand; // nếu có → chế độ SỬA
  title?: string;
}) {
  const { addBrand, updateBrand } = useData();
  const [form, setForm] = useState({
    name: editBrand?.name ?? defaults?.name ?? "",
    industry: editBrand?.industry ?? "",
    stage: (editBrand?.stage ?? "lead") as BrandStage,
    ownerId: editBrand?.ownerId ?? "u1",
    contactName: editBrand?.contacts[0]?.name ?? defaults?.contactName ?? "",
    contactEmail: editBrand?.contacts[0]?.email ?? defaults?.contactEmail ?? "",
    contactPhone: editBrand?.contacts[0]?.phone ?? "",
    note: editBrand?.note ?? "",
  });

  if (!open) return null;
  const heading = title ?? (editBrand ? "Sửa nhãn hàng" : "Thêm nhãn hàng");

  const input =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100";
  const label = "mb-1.5 block text-xs font-semibold text-zinc-500";

  function submit() {
    if (!form.name.trim()) return;
    if (editBrand) {
      const contacts = form.contactName || form.contactEmail || form.contactPhone
        ? [{ name: form.contactName.trim() || form.name.trim(), role: editBrand.contacts[0]?.role || "Liên hệ", email: form.contactEmail.trim() || undefined, phone: form.contactPhone.trim() || undefined }, ...editBrand.contacts.slice(1)]
        : editBrand.contacts;
      updateBrand(editBrand.id, {
        name: form.name.trim(),
        industry: form.industry.trim() || "Chưa phân loại",
        stage: form.stage,
        ownerId: form.ownerId,
        note: form.note.trim() || undefined,
        contacts,
      });
      onClose();
      return;
    }
    const brand = addBrand(form);
    onCreated?.(brand);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-900">{heading}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700">
            <IconClose className="size-5" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <div>
            <label className={label}>Tên nhãn hàng / khách hàng *</label>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Hasaki Beauty"
              className={input}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Lĩnh vực</label>
              <input
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                placeholder="Mỹ phẩm, F&B..."
                className={input}
              />
            </div>
            <div>
              <label className={label}>Nhân viên phụ trách</label>
              <select
                value={form.ownerId}
                onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
                className={input}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={label}>Trạng thái</label>
            <div className="grid grid-cols-4 gap-2">
              {STAGES.map((s) => (
                <button
                  key={s}
                  onClick={() => setForm({ ...form, stage: s })}
                  className={cn(
                    "rounded-lg border px-2 py-1.5 text-xs font-medium transition",
                    form.stage === s
                      ? "border-violet-400 bg-violet-50 text-violet-700"
                      : "border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                  )}
                >
                  {STAGE_META[s].label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-zinc-50 p-3">
            <div className="mb-2 text-xs font-semibold text-zinc-500">Người liên hệ (tùy chọn)</div>
            <div className="space-y-2">
              <input
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                placeholder="Tên người liên hệ"
                className={input}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  placeholder="Email"
                  className={input}
                />
                <input
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  placeholder="Số điện thoại"
                  className={input}
                />
              </div>
            </div>
          </div>

          <div>
            <label className={label}>Ghi chú</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={2}
              placeholder="Ghi chú về nhãn hàng..."
              className={cn(input, "resize-none")}
            />
          </div>
        </div>

        <div className="flex gap-2 border-t border-zinc-100 p-4">
          <button onClick={onClose} className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
            Hủy
          </button>
          <button
            onClick={submit}
            disabled={!form.name.trim()}
            className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-40"
          >
            Lưu nhãn hàng
          </button>
        </div>
      </div>
    </div>
  );
}
