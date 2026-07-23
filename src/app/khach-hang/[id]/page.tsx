"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Avatar, Badge } from "@/components/ui";
import { useData } from "@/components/DataProvider";
import AddBrandModal from "@/components/AddBrandModal";
import {
  IconArrowLeft,
  IconPhone,
  IconMail,
  IconPaperclip,
  IconPlus,
  IconInbox,
  IconClock,
  IconFlag,
  IconDot,
  IconPencil,
  IconTrash,
} from "@/components/icons";
import { userById } from "@/lib/mock-data";
import { formatVND, formatDay, timeAgo, STAGE_META } from "@/lib/utils";
import type { TimelineType } from "@/lib/types";

const BOOKING_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: "Chờ ký", className: "bg-amber-100 text-amber-700" },
  signed: { label: "Đã ký", className: "bg-sky-100 text-sky-700" },
  done: { label: "Hoàn thành", className: "bg-emerald-100 text-emerald-700" },
};

const TL_ICON: Record<TimelineType, { icon: typeof IconDot; tint: string }> = {
  note: { icon: IconDot, tint: "bg-zinc-100 text-zinc-500" },
  message: { icon: IconInbox, tint: "bg-sky-100 text-sky-600" },
  booking: { icon: IconFlag, tint: "bg-emerald-100 text-emerald-600" },
  task: { icon: IconClock, tint: "bg-violet-100 text-violet-600" },
  call: { icon: IconPhone, tint: "bg-amber-100 text-amber-600" },
};

export default function BrandProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { findBrand, loaded, removeBrand } = useData();
  const [editing, setEditing] = useState(false);
  const brand = findBrand(id);

  if (!loaded) {
    return <div className="p-6 text-sm text-zinc-400">Đang tải hồ sơ...</div>;
  }

  if (!brand) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <Link href="/khach-hang" className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-800">
          <IconArrowLeft className="size-4" /> Quay lại danh sách
        </Link>
        <Card className="mt-4 flex flex-col items-center justify-center px-6 py-16 text-center">
          <h3 className="text-base font-semibold text-zinc-800">Không tìm thấy nhãn hàng</h3>
          <p className="mt-1 text-sm text-zinc-500">Hồ sơ này có thể đã bị xóa.</p>
        </Card>
      </div>
    );
  }

  const owner = userById(brand.ownerId);

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 lg:p-6">
      <Link href="/khach-hang" className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-800">
        <IconArrowLeft className="size-4" /> Quay lại danh sách
      </Link>

      {/* Header hồ sơ */}
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar label={brand.logo} color={brand.color} size={64} />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-900">{brand.name}</h1>
              <Badge className={`ring-1 ring-inset ${STAGE_META[brand.stage].className}`}>
                {STAGE_META[brand.stage].label}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-zinc-500">{brand.industry} · Tạo ngày {brand.createdAt}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <IconPencil className="size-4" /> Sửa
            </button>
            <button
              onClick={() => {
                if (confirm(`Xóa nhãn hàng "${brand.name}"?`)) {
                  removeBrand(brand.id);
                  router.push("/khach-hang");
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

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4 sm:grid-cols-4">
          <div>
            <div className="text-xs text-zinc-400">Tổng giá trị HĐ</div>
            <div className="text-lg font-bold text-zinc-900">{formatVND(brand.totalValue)}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-400">Số booking</div>
            <div className="text-lg font-bold text-zinc-900">{brand.bookings.length}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-400">Người liên hệ</div>
            <div className="text-lg font-bold text-zinc-900">{brand.contacts.length}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-400">Phụ trách</div>
            <div className="mt-1 flex items-center gap-1.5">
              {owner && <Avatar label={owner.avatar} color={owner.color} size={24} />}
              <span className="text-sm font-medium text-zinc-700">{owner?.name}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Cột trái */}
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="mb-3 text-base font-semibold text-zinc-900">Người liên hệ</h2>
            {brand.contacts.length === 0 ? (
              <p className="text-sm text-zinc-400">Chưa có người liên hệ.</p>
            ) : (
              <div className="space-y-3">
                {brand.contacts.map((c, i) => (
                  <div key={i} className="rounded-xl bg-zinc-50 p-3">
                    <div className="text-sm font-semibold text-zinc-800">{c.name}</div>
                    {c.role && <div className="text-xs text-zinc-400">{c.role}</div>}
                    <div className="mt-2 space-y-1 text-xs text-zinc-600">
                      {c.phone && <div className="flex items-center gap-1.5"><IconPhone className="size-3.5" />{c.phone}</div>}
                      {c.email && <div className="flex items-center gap-1.5"><IconMail className="size-3.5" />{c.email}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {brand.note && (
            <Card className="p-5">
              <h2 className="mb-2 text-base font-semibold text-zinc-900">Ghi chú</h2>
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{brand.note}</p>
            </Card>
          )}

          <Card className="p-5">
            <h2 className="mb-3 text-base font-semibold text-zinc-900">File đính kèm</h2>
            {brand.attachments.length === 0 ? (
              <p className="text-sm text-zinc-400">Chưa có file nào.</p>
            ) : (
              <div className="space-y-2">
                {brand.attachments.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-zinc-100 p-2.5 hover:bg-zinc-50">
                    <span className="inline-flex size-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                      <IconPaperclip className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-zinc-700">{f.name}</div>
                      <div className="text-xs text-zinc-400">{f.size}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Cột giữa+phải */}
        <div className="space-y-5 lg:col-span-2">
          <Card className="p-5">
            <h2 className="mb-3 text-base font-semibold text-zinc-900">Lịch sử booking</h2>
            {brand.bookings.length === 0 ? (
              <p className="text-sm text-zinc-400">Chưa có booking nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-left text-xs text-zinc-400">
                      <th className="pb-2 font-medium">Chiến dịch</th>
                      <th className="pb-2 font-medium">Ngày</th>
                      <th className="pb-2 text-right font-medium">Giá trị</th>
                      <th className="pb-2 text-right font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {brand.bookings.map((bk) => (
                      <tr key={bk.id}>
                        <td className="py-2.5 font-medium text-zinc-800">{bk.campaign}</td>
                        <td className="py-2.5 text-zinc-500">{formatDay(bk.date)}</td>
                        <td className="py-2.5 text-right font-medium tabular-nums text-zinc-800">{formatVND(bk.value)}</td>
                        <td className="py-2.5 text-right">
                          <Badge className={BOOKING_STATUS[bk.status].className}>{BOOKING_STATUS[bk.status].label}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-base font-semibold text-zinc-900">Lịch sử tương tác</h2>
            <ol className="relative space-y-5 border-l border-zinc-200 pl-6">
              {brand.timeline
                .slice()
                .sort((a, b) => +new Date(b.date) - +new Date(a.date))
                .map((ev) => {
                  const meta = TL_ICON[ev.type];
                  const Icon = meta.icon;
                  const author = userById(ev.authorId);
                  return (
                    <li key={ev.id} className="relative">
                      <span className={`absolute -left-[33px] inline-flex size-6 items-center justify-center rounded-full ring-4 ring-white ${meta.tint}`}>
                        <Icon className="size-3.5" />
                      </span>
                      <div className="text-sm text-zinc-800">{ev.content}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-400">
                        <span>{timeAgo(ev.date)}</span>
                        {author && (
                          <>
                            <span>·</span>
                            <span>{author.name}</span>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
            </ol>
          </Card>
        </div>
      </div>

      {editing && <AddBrandModal open editBrand={brand} onClose={() => setEditing(false)} />}
    </div>
  );
}
