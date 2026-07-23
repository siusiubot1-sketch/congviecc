"use client";

import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { Card, Avatar } from "@/components/ui";
import {
  IconPlus,
  IconVerified,
  IconChevronRight,
  IconHeart,
  IconPlay,
  IconStar,
  IconPencil,
  IconTrash,
} from "@/components/icons";
import CreatorModal from "@/components/CreatorModal";
import { useData } from "@/components/DataProvider";
import { userById } from "@/lib/mock-data";
import { shortVND } from "@/lib/utils";
import type { Creator } from "@/lib/types";

function compact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return String(n);
}

export default function CreatorsPage() {
  const { creators, loaded, removeCreator } = useData();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Creator | null>(null);

  const totalFollowers = creators.reduce((s, c) => s + c.followers, 0);
  const totalRevenue = creators.reduce((s, c) => s + c.campaigns.reduce((x, cp) => x + cp.value, 0), 0);

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 lg:p-6">
      <PageHeader
        title="KOL của tôi"
        subtitle="Danh sách nhà sáng tạo bạn đang quản lý — hồ sơ, chỉ số & lịch booking."
        actions={
          <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700">
            <IconPlus className="size-4" /> Thêm KOL
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4"><div className="text-sm text-zinc-500">Số KOL quản lý</div><div className="mt-1 text-2xl font-bold text-zinc-900">{creators.length}</div></Card>
        <Card className="p-4"><div className="text-sm text-zinc-500">Tổng follower</div><div className="mt-1 text-2xl font-bold text-zinc-900">{compact(totalFollowers)}</div></Card>
        <Card className="p-4"><div className="text-sm text-zinc-500">Đang hoạt động</div><div className="mt-1 text-2xl font-bold text-emerald-600">{creators.filter((c) => c.status === "active").length}</div></Card>
        <Card className="p-4"><div className="text-sm text-zinc-500">Doanh thu booking</div><div className="mt-1 text-2xl font-bold text-zinc-900">{shortVND(totalRevenue)}</div></Card>
      </div>

      {loaded && creators.length === 0 ? (
        <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <span className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-500"><IconStar className="size-7" /></span>
          <h3 className="text-base font-semibold text-zinc-800">Chưa có KOL nào</h3>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">Thêm nhà sáng tạo bạn đang quản lý để theo dõi chỉ số và lịch booking.</p>
          <button onClick={() => setAdding(true)} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">
            <IconPlus className="size-4" /> Thêm KOL đầu tiên
          </button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {creators.map((c) => {
            const manager = userById(c.managerId);
            const revenue = c.campaigns.reduce((s, cp) => s + cp.value, 0);
            return (
              <Card key={c.id} className="group relative overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => setEditing(c)} title="Sửa" className="rounded-lg bg-white/90 p-1.5 text-zinc-600 shadow-sm ring-1 ring-zinc-200 hover:text-violet-600">
                    <IconPencil className="size-3.5" />
                  </button>
                  <button onClick={() => { if (confirm(`Xóa KOL "${c.displayName}"?`)) removeCreator(c.id); }} title="Xóa" className="rounded-lg bg-white/90 p-1.5 text-zinc-600 shadow-sm ring-1 ring-zinc-200 hover:text-rose-600">
                    <IconTrash className="size-3.5" />
                  </button>
                </div>
                <Link href={`/kol/${c.id}`}>
                  <div className="relative h-24" style={{ background: c.cover }}>
                    <span className="absolute right-3 top-3 rounded-full bg-black/25 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
                      {c.status === "active" ? "● Đang hoạt động" : "Tạm dừng"}
                    </span>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="-mt-9 mb-2 flex items-end justify-between">
                      <div className="rounded-2xl bg-white p-1 shadow-sm"><Avatar label={c.avatar} color={c.color} size={60} /></div>
                      <IconChevronRight className="mb-2 size-5 text-zinc-300 transition group-hover:text-violet-500" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-zinc-900">{c.displayName}</h3>
                      {c.verified && <IconVerified className="size-4" />}
                    </div>
                    <div className="text-sm text-zinc-400">{c.handle}</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {c.niche.map((n) => <span key={n} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">{n}</span>)}
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-zinc-100 pt-3 text-center">
                      <div><div className="text-sm font-bold text-zinc-900">{compact(c.followers)}</div><div className="text-[11px] text-zinc-400">Follower</div></div>
                      <div><div className="flex items-center justify-center gap-0.5 text-sm font-bold text-zinc-900"><IconHeart className="size-3.5 text-rose-500" />{compact(c.likes)}</div><div className="text-[11px] text-zinc-400">Thích</div></div>
                      <div><div className="flex items-center justify-center gap-0.5 text-sm font-bold text-zinc-900"><IconPlay className="size-3.5 text-zinc-500" />{c.videos}</div><div className="text-[11px] text-zinc-400">Video</div></div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs">
                      <span className="text-zinc-400">Doanh thu: <span className="font-semibold text-zinc-700">{shortVND(revenue)}</span></span>
                      {manager && <span className="flex items-center gap-1.5 text-zinc-400">QL: <Avatar label={manager.avatar} color={manager.color} size={20} /></span>}
                    </div>
                  </div>
                </Link>
              </Card>
            );
          })}
        </div>
      )}

      {adding && <CreatorModal open onClose={() => setAdding(false)} />}
      {editing && <CreatorModal open editCreator={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
