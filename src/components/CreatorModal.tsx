"use client";

import { useState } from "react";
import type { Creator } from "@/lib/types";
import { users } from "@/lib/mock-data";
import { useData, uid } from "./DataProvider";
import { cn } from "@/lib/utils";
import { IconClose } from "./icons";

const COVERS = [
  "linear-gradient(120deg, #f43f5e 0%, #a855f7 55%, #6366f1 100%)",
  "linear-gradient(120deg, #06b6d4 0%, #3b82f6 100%)",
  "linear-gradient(120deg, #f59e0b 0%, #ef4444 100%)",
  "linear-gradient(120deg, #10b981 0%, #06b6d4 100%)",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function CreatorModal({
  open,
  onClose,
  editCreator,
}: {
  open: boolean;
  onClose: () => void;
  editCreator?: Creator;
}) {
  const { addCreator, updateCreator } = useData();
  const [form, setForm] = useState({
    displayName: editCreator?.displayName ?? "",
    handle: editCreator?.handle ?? "",
    tiktokUrl: editCreator?.socials.find((s) => s.platform === "tiktok")?.url ?? "",
    bio: editCreator?.bio ?? "",
    niche: editCreator?.niche.join(", ") ?? "",
    location: editCreator?.location ?? "",
    managerId: editCreator?.managerId ?? "u1",
    followers: editCreator?.followers ?? 0,
    likes: editCreator?.likes ?? 0,
    videos: editCreator?.videos ?? 0,
    avgViews: editCreator?.avgViews ?? 0,
    engagement: editCreator?.engagement ?? 0,
    email: editCreator?.email ?? "",
    phone: editCreator?.phone ?? "",
  });

  if (!open) return null;
  const input =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100";
  const label = "mb-1.5 block text-xs font-semibold text-zinc-500";

  function submit() {
    if (!form.displayName.trim()) return;
    const handle = form.handle.trim().startsWith("@") ? form.handle.trim() : `@${form.handle.trim()}`;
    const niche = form.niche.split(",").map((s) => s.trim()).filter(Boolean);
    const common = {
      displayName: form.displayName.trim(),
      handle,
      bio: form.bio.trim(),
      niche,
      location: form.location.trim() || "Việt Nam",
      managerId: form.managerId,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      followers: Number(form.followers) || 0,
      likes: Number(form.likes) || 0,
      videos: Number(form.videos) || 0,
      avgViews: Number(form.avgViews) || 0,
      engagement: Number(form.engagement) || 0,
      socials: form.tiktokUrl.trim()
        ? [{ platform: "tiktok" as const, handle, url: form.tiktokUrl.trim() }]
        : editCreator?.socials ?? [],
    };

    if (editCreator) {
      updateCreator(editCreator.id, { ...common, avatar: initials(form.displayName) });
    } else {
      const creator: Creator = {
        id: uid("k"),
        avatar: initials(form.displayName),
        color: "#e11d48",
        cover: COVERS[Math.floor(Math.random() * COVERS.length)],
        verified: false,
        status: "active",
        joinedAt: new Date().toISOString().slice(0, 10),
        growth: [0, 0, 0, 0, 0, 0, Number(form.followers) / 1000 || 0],
        genderFemale: 70,
        topAge: "18–24",
        topLocations: [],
        rateCard: [],
        campaigns: [],
        ...common,
      };
      addCreator(creator);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-900">{editCreator ? "Sửa KOL" : "Thêm KOL"}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700"><IconClose className="size-5" /></button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Tên hiển thị *</label>
              <input autoFocus value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Ngọc Kem" className={input} />
            </div>
            <div>
              <label className={label}>Handle (@)</label>
              <input value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} placeholder="ngockemm" className={input} />
            </div>
          </div>
          <div>
            <label className={label}>Link TikTok</label>
            <input value={form.tiktokUrl} onChange={(e) => setForm({ ...form, tiktokUrl: e.target.value })} placeholder="https://www.tiktok.com/@..." className={input} />
          </div>
          <div>
            <label className={label}>Bio</label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={2} placeholder="Giới thiệu ngắn..." className={cn(input, "resize-none")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Lĩnh vực (phẩy)</label>
              <input value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} placeholder="Làm đẹp, Lifestyle" className={input} />
            </div>
            <div>
              <label className={label}>Khu vực</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="TP.HCM" className={input} />
            </div>
          </div>

          <div className="rounded-xl bg-zinc-50 p-3">
            <div className="mb-2 text-xs font-semibold text-zinc-500">Chỉ số (nhập số thật)</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                ["followers", "Follower"],
                ["likes", "Lượt thích"],
                ["videos", "Video"],
                ["avgViews", "View TB"],
                ["engagement", "Tương tác %"],
              ].map(([key, lb]) => (
                <div key={key}>
                  <label className="mb-1 block text-[11px] text-zinc-400">{lb}</label>
                  <input
                    type="number"
                    value={form[key as keyof typeof form] as number}
                    onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                    className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm outline-none focus:border-violet-400"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Nhân viên quản lý</label>
              <select value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })} className={input}>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Email booking</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@..." className={input} />
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-zinc-100 p-4">
          <button onClick={onClose} className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Hủy</button>
          <button onClick={submit} disabled={!form.displayName.trim()} className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-40">
            {editCreator ? "Lưu thay đổi" : "Thêm KOL"}
          </button>
        </div>
      </div>
    </div>
  );
}
