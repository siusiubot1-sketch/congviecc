"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { Card, Avatar, Badge } from "@/components/ui";
import { IconPlus, IconChevronRight, IconPhone, IconMail, IconUsers, IconPencil, IconTrash } from "@/components/icons";
import AddBrandModal from "@/components/AddBrandModal";
import { useData } from "@/components/DataProvider";
import { userById } from "@/lib/mock-data";
import { formatVND, shortVND, STAGE_META, cn } from "@/lib/utils";
import type { Brand, BrandStage } from "@/lib/types";

const STAGES: BrandStage[] = ["lead", "dealing", "won", "lost"];

export default function CrmPage() {
  const { brands, loaded, removeBrand } = useData();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [filter, setFilter] = useState<"all" | BrandStage>("all");

  const totalValue = brands.reduce((s, b) => s + b.totalValue, 0);
  const shown = useMemo(
    () => (filter === "all" ? brands : brands.filter((b) => b.stage === filter)),
    [brands, filter]
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 lg:p-6">
      <PageHeader
        title="Khách hàng & Nhãn hàng"
        subtitle="Hồ sơ nhãn hàng, lịch sử booking, giá trị hợp đồng và tương tác."
        actions={
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
          >
            <IconPlus className="size-4" /> Thêm nhãn hàng
          </button>
        }
      />

      {/* Tóm tắt */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm text-zinc-500">Tổng nhãn hàng</div>
          <div className="mt-1 text-2xl font-bold text-zinc-900">{brands.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-zinc-500">Đã chốt</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">
            {brands.filter((b) => b.stage === "won").length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-zinc-500">Đang deal</div>
          <div className="mt-1 text-2xl font-bold text-amber-600">
            {brands.filter((b) => b.stage === "dealing").length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-zinc-500">Tổng giá trị HĐ</div>
          <div className="mt-1 text-2xl font-bold text-zinc-900">{shortVND(totalValue)}</div>
        </Card>
      </div>

      {/* Bộ lọc trạng thái */}
      {brands.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium",
              filter === "all" ? "bg-violet-600 text-white" : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
            )}
          >
            Tất cả ({brands.length})
          </button>
          {STAGES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium",
                filter === s ? "bg-violet-600 text-white" : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
              )}
            >
              {STAGE_META[s].label} ({brands.filter((b) => b.stage === s).length})
            </button>
          ))}
        </div>
      )}

      {/* Trạng thái rỗng */}
      {loaded && brands.length === 0 ? (
        <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <span className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-500">
            <IconUsers className="size-7" />
          </span>
          <h3 className="text-base font-semibold text-zinc-800">Chưa có nhãn hàng nào</h3>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">
            Thêm nhãn hàng/khách hàng thủ công, hoặc tạo trực tiếp từ một email trong Hộp thư hợp nhất.
          </p>
          <button
            onClick={() => setAdding(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            <IconPlus className="size-4" /> Thêm nhãn hàng đầu tiên
          </button>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((b) => {
            const owner = userById(b.ownerId);
            const contact = b.contacts[0];
            return (
              <Link key={b.id} href={`/khach-hang/${b.id}`}>
                <Card className="group relative h-full p-4 transition hover:border-violet-200 hover:shadow-md">
                  {/* Nút sửa/xóa (hiện khi hover) */}
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={(e) => { e.preventDefault(); setEditing(b); }}
                      title="Sửa"
                      className="rounded-lg bg-white/90 p-1.5 text-zinc-500 shadow-sm ring-1 ring-zinc-200 hover:text-violet-600"
                    >
                      <IconPencil className="size-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirm(`Xóa nhãn hàng "${b.name}"?`)) removeBrand(b.id);
                      }}
                      title="Xóa"
                      className="rounded-lg bg-white/90 p-1.5 text-zinc-500 shadow-sm ring-1 ring-zinc-200 hover:text-rose-600"
                    >
                      <IconTrash className="size-3.5" />
                    </button>
                  </div>
                  <div className="flex items-start gap-3">
                    <Avatar label={b.logo} color={b.color} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate pr-14 font-semibold text-zinc-900">{b.name}</h3>
                        <IconChevronRight className="size-4 shrink-0 text-zinc-300 transition group-hover:text-violet-500" />
                      </div>
                      <p className="truncate text-xs text-zinc-400">{b.industry}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Badge className={`ring-1 ring-inset ${STAGE_META[b.stage].className}`}>
                      {STAGE_META[b.stage].label}
                    </Badge>
                    <span className="text-xs text-zinc-400">{b.bookings.length} booking</span>
                  </div>

                  {contact && (
                    <div className="mt-3 space-y-1 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
                      <div className="font-medium text-zinc-700">{contact.name}{contact.role ? ` · ${contact.role}` : ""}</div>
                      {contact.phone && (
                        <div className="flex items-center gap-1.5"><IconPhone className="size-3.5" />{contact.phone}</div>
                      )}
                      {contact.email && (
                        <div className="flex items-center gap-1.5"><IconMail className="size-3.5" />{contact.email}</div>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3">
                    <div>
                      <div className="text-xs text-zinc-400">Giá trị HĐ</div>
                      <div className="text-sm font-semibold text-zinc-900">
                        {b.totalValue > 0 ? formatVND(b.totalValue) : "—"}
                      </div>
                    </div>
                    {owner && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-zinc-400">Phụ trách</span>
                        <Avatar label={owner.avatar} color={owner.color} size={26} />
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {adding && <AddBrandModal open onClose={() => setAdding(false)} />}
      {editing && <AddBrandModal open editBrand={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
