"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Avatar, Badge } from "@/components/ui";
import { LineChart } from "@/components/charts";
import { useData } from "@/components/DataProvider";
import CreatorModal from "@/components/CreatorModal";
import {
  IconArrowLeft,
  IconVerified,
  IconLink,
  IconHeart,
  IconEye,
  IconPlay,
  IconUsers,
  IconTrend,
  IconMail,
  IconPhone,
  IconSparkle,
  IconPlus,
  IconPencil,
  IconTrash,
} from "@/components/icons";
import { userById } from "@/lib/mock-data";
import { cn, formatVND, shortVND, formatDay } from "@/lib/utils";
import type { Creator } from "@/lib/types";

function compact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

const BK_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: "Chờ ký", className: "bg-amber-100 text-amber-700" },
  signed: { label: "Đã ký", className: "bg-sky-100 text-sky-700" },
  done: { label: "Hoàn thành", className: "bg-emerald-100 text-emerald-700" },
};

const SOCIAL_META: Record<string, { label: string; color: string; icon: string }> = {
  tiktok: { label: "TikTok", color: "#000000", icon: "T" },
  instagram: { label: "Instagram", color: "#e1306c", icon: "I" },
  youtube: { label: "YouTube", color: "#ff0000", icon: "Y" },
  facebook: { label: "Facebook", color: "#1877f2", icon: "f" },
};

export default function CreatorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { findCreator, updateCreator, removeCreator, findBrand, loaded } = useData();
  const [editing, setEditing] = useState(false); // chế độ sửa chỉ số nhanh
  const [editModal, setEditModal] = useState(false); // modal sửa đầy đủ
  const creator = findCreator(id);

  if (!loaded) return <div className="p-6 text-sm text-zinc-400">Đang tải hồ sơ...</div>;
  if (!creator) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <Link href="/kol" className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-800">
          <IconArrowLeft className="size-4" /> Danh sách KOL
        </Link>
        <Card className="mt-4 flex flex-col items-center justify-center px-6 py-16 text-center">
          <h3 className="text-base font-semibold text-zinc-800">Không tìm thấy KOL</h3>
          <p className="mt-1 text-sm text-zinc-500">Hồ sơ này có thể đã bị xóa.</p>
        </Card>
      </div>
    );
  }

  const manager = userById(creator.managerId);
  const revenue = creator.campaigns.reduce((s, c) => s + c.value, 0);
  const tiktok = creator.socials.find((s) => s.platform === "tiktok");

  const stats = [
    { key: "followers", label: "Người theo dõi", icon: IconUsers, value: creator.followers, fmt: compact, tint: "text-violet-600 bg-violet-50" },
    { key: "likes", label: "Lượt thích", icon: IconHeart, value: creator.likes, fmt: compact, tint: "text-rose-600 bg-rose-50" },
    { key: "videos", label: "Video", icon: IconPlay, value: creator.videos, fmt: (n: number) => String(n), tint: "text-zinc-700 bg-zinc-100" },
    { key: "avgViews", label: "View trung bình", icon: IconEye, value: creator.avgViews, fmt: compact, tint: "text-sky-600 bg-sky-50" },
    { key: "engagement", label: "Tương tác", icon: IconTrend, value: creator.engagement, fmt: (n: number) => n + "%", tint: "text-emerald-600 bg-emerald-50" },
  ] as const;

  function setStat(key: string, val: number) {
    updateCreator(creator!.id, { [key]: val } as Partial<Creator>);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <Link href="/kol" className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-800">
          <IconArrowLeft className="size-4" /> Danh sách KOL
        </Link>
        <button
          onClick={() => setEditing((e) => !e)}
          className={cn(
            "rounded-xl px-3.5 py-1.5 text-sm font-semibold transition",
            editing ? "bg-emerald-600 text-white hover:bg-emerald-700" : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
          )}
        >
          {editing ? "✓ Lưu chỉ số" : "Chỉnh sửa chỉ số"}
        </button>
      </div>

      {/* ===== HERO ===== */}
      <Card className="overflow-hidden p-0">
        <div className="relative h-40 sm:h-48" style={{ background: creator.cover }}>
          <div className="absolute inset-0 bg-black/5" />
          <span className="absolute right-4 top-4 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            {creator.status === "active" ? "● Đang hoạt động" : "Tạm dừng"}
          </span>
        </div>

        <div className="px-5 pb-5 sm:px-7">
          <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="rounded-3xl bg-white p-1.5 shadow-lg">
                <Avatar label={creator.avatar} color={creator.color} size={92} />
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-zinc-900">{creator.displayName}</h1>
                  {creator.verified && <IconVerified className="size-6" />}
                </div>
                <div className="text-sm font-medium text-zinc-500">{creator.handle}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {tiktok && (
                <a
                  href={tiktok.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  <IconLink className="size-4" /> Xem TikTok
                </a>
              )}
              <button onClick={() => setEditModal(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                <IconPencil className="size-4" /> Sửa
              </button>
              <button
                onClick={() => {
                  if (confirm(`Xóa KOL "${creator.displayName}"?`)) {
                    removeCreator(creator.id);
                    router.push("/kol");
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <IconTrash className="size-4" /> Xóa
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-violet-700">
                <IconPlus className="size-4" /> Booking mới
              </button>
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600">{creator.bio}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {creator.niche.map((n) => (
              <span key={n} className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                #{n}
              </span>
            ))}
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500">📍 {creator.location}</span>
          </div>
        </div>
      </Card>

      {/* ===== CHỈ SỐ ===== */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.key} className="p-4">
              <span className={cn("inline-flex size-8 items-center justify-center rounded-lg", s.tint)}>
                <Icon className="size-4" />
              </span>
              {editing ? (
                <input
                  type="number"
                  value={creator[s.key as keyof Creator] as number}
                  onChange={(e) => setStat(s.key, Number(e.target.value))}
                  className="mt-2 w-full rounded-lg border border-violet-300 bg-white px-2 py-1 text-lg font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-violet-200"
                />
              ) : (
                <div className="mt-2 text-xl font-bold tracking-tight text-zinc-900">{s.fmt(s.value)}</div>
              )}
              <div className="text-xs text-zinc-400">{s.label}</div>
            </Card>
          );
        })}
      </div>

      {editing && (
        <div className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          💡 TikTok không cho lấy số liệu tự động. Nhập số thật từ trang <span className="font-medium">{creator.handle}</span> vào các ô trên rồi bấm <span className="font-medium">Lưu chỉ số</span>.
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* CỘT CHÍNH */}
        <div className="space-y-5 lg:col-span-2">
          {/* Tăng trưởng */}
          <Card className="p-5">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">Tăng trưởng follower</h2>
              <Badge className="bg-emerald-100 text-emerald-700">
                +{compact(creator.growth[creator.growth.length - 1] * 1000 - creator.growth[0] * 1000)} (7 kỳ)
              </Badge>
            </div>
            <p className="mb-3 text-sm text-zinc-500">Đơn vị: nghìn follower</p>
            <LineChart data={creator.growth} color={creator.color} height={170} />
          </Card>

          {/* Bảng giá */}
          <Card className="p-5">
            <h2 className="mb-3 text-base font-semibold text-zinc-900">Bảng giá dịch vụ (Rate card)</h2>
            <div className="divide-y divide-zinc-100">
              {creator.rateCard.map((r) => (
                <div key={r.service} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-zinc-700">{r.service}</span>
                  <span className="text-sm font-semibold tabular-nums text-zinc-900">{formatVND(r.price)}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Lịch sử booking */}
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">Lịch sử booking</h2>
              <span className="text-sm text-zinc-400">Tổng: <span className="font-semibold text-zinc-700">{shortVND(revenue)}</span></span>
            </div>
            <div className="space-y-2">
              {creator.campaigns.map((c, i) => {
                const brand = findBrand(c.brandId);
                return (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-zinc-100 p-3">
                    {brand && (
                      <Link href={`/khach-hang/${brand.id}`}>
                        <Avatar label={brand.logo} color={brand.color} size={36} />
                      </Link>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-zinc-800">{c.campaign}</div>
                      <div className="text-xs text-zinc-400">{brand?.name} · {formatDay(c.date)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-zinc-900">{formatVND(c.value)}</div>
                      <Badge className={BK_STATUS[c.status].className}>{BK_STATUS[c.status].label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-5">
          {/* Khán giả */}
          <Card className="p-5">
            <h2 className="mb-4 text-base font-semibold text-zinc-900">Chân dung khán giả</h2>
            <div className="mb-4 flex items-center gap-4">
              <div className="relative flex size-20 items-center justify-center">
                <svg viewBox="0 0 36 36" className="size-20 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f1f4" strokeWidth="3.5" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ec4899" strokeWidth="3.5" strokeDasharray={`${creator.genderFemale} ${100 - creator.genderFemale}`} strokeLinecap="round" />
                </svg>
                <span className="absolute text-sm font-bold text-zinc-800">{creator.genderFemale}%</span>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-pink-500" />Nữ {creator.genderFemale}%</div>
                <div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-sky-500" />Nam {100 - creator.genderFemale}%</div>
                <div className="text-xs text-zinc-400">Độ tuổi chính: {creator.topAge}</div>
              </div>
            </div>
            <div className="space-y-2.5 border-t border-zinc-100 pt-3">
              <div className="text-xs font-medium text-zinc-400">Khu vực hàng đầu</div>
              {creator.topLocations.map((l) => (
                <div key={l.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-zinc-600">{l.name}</span>
                    <span className="font-medium text-zinc-500">{l.percent}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                    <div className="h-full rounded-full bg-violet-500" style={{ width: `${l.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quản lý */}
          <Card className="p-5">
            <h2 className="mb-3 text-base font-semibold text-zinc-900">Thông tin quản lý</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Nhân viên QL</span>
                {manager && (
                  <span className="flex items-center gap-1.5 font-medium text-zinc-700">
                    <Avatar label={manager.avatar} color={manager.color} size={22} /> {manager.name}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Trạng thái</span>
                <Badge className="bg-emerald-100 text-emerald-700">Đang hoạt động</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Hợp tác từ</span>
                <span className="font-medium text-zinc-700">{creator.joinedAt}</span>
              </div>
              {creator.email && (
                <div className="flex items-center gap-2 text-zinc-600"><IconMail className="size-4 text-zinc-400" />{creator.email}</div>
              )}
              {creator.phone && (
                <div className="flex items-center gap-2 text-zinc-600"><IconPhone className="size-4 text-zinc-400" />{creator.phone}</div>
              )}
            </div>
          </Card>

          {/* Kênh mạng xã hội */}
          <Card className="p-5">
            <h2 className="mb-3 text-base font-semibold text-zinc-900">Kênh mạng xã hội</h2>
            <div className="space-y-2">
              {creator.socials.map((s) => {
                const meta = SOCIAL_META[s.platform];
                return (
                  <a
                    key={s.platform}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-zinc-100 p-2.5 hover:border-violet-200 hover:bg-violet-50/40"
                  >
                    <span className="inline-flex size-8 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: meta.color }}>
                      {meta.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-zinc-800">{meta.label}</div>
                      <div className="truncate text-xs text-zinc-400">{s.handle}</div>
                    </div>
                    <IconLink className="size-4 text-zinc-300" />
                  </a>
                );
              })}
            </div>
          </Card>

          {/* Gợi ý AI */}
          <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-violet-700">
              <IconSparkle className="size-4" /> Gợi ý từ AI
            </div>
            <p className="mt-2 text-sm text-zinc-600">
              Tỉ lệ tương tác {creator.engagement}% cao hơn mức trung bình ngành làm đẹp (4–5%). Ưu tiên chào các nhãn mỹ phẩm cho gói livestream để tối ưu doanh thu.
            </p>
          </Card>
        </div>
      </div>

      {editModal && <CreatorModal open editCreator={creator} onClose={() => setEditModal(false)} />}
    </div>
  );
}
