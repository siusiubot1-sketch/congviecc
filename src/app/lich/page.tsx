"use client";

import { useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, Avatar, Badge } from "@/components/ui";
import { IconBell, IconClock, IconChevronRight, IconArrowLeft } from "@/components/icons";
import { useData } from "@/components/DataProvider";
import { userById } from "@/lib/mock-data";
import { cn, daysLeft, PRIORITY_META } from "@/lib/utils";
import type { Task } from "@/lib/types";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

function iso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function monthCells(year: number, month: number): (number | null)[] {
  const startWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// Mini-lịch 1 tháng (dùng trong chế độ xem năm)
function MiniMonth({
  year,
  month,
  byDate,
  today,
  onOpen,
}: {
  year: number;
  month: number;
  byDate: Record<string, Task[]>;
  today: { y: number; m: number; d: number };
  onOpen: () => void;
}) {
  const cells = monthCells(year, month);
  const count = cells.filter((d) => d !== null && byDate[iso(year, month, d)]).length;
  return (
    <button onClick={onOpen} className="rounded-xl border border-zinc-200 bg-white p-3 text-left transition hover:border-violet-300 hover:shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-800">{MONTH_NAMES[month]}</span>
        {count > 0 && <span className="rounded-full bg-violet-100 px-1.5 text-[10px] font-medium text-violet-700">{count}</span>}
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[9px] text-zinc-300">
        {WEEKDAYS.map((w) => <div key={w}>{w[1]}</div>)}
      </div>
      <div className="mt-0.5 grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} className="aspect-square" />;
          const has = !!byDate[iso(year, month, d)];
          const isToday = today.y === year && today.m === month && today.d === d;
          return (
            <div key={i} className="flex aspect-square items-center justify-center">
              <span
                className={cn(
                  "flex size-4 items-center justify-center rounded-full text-[9px]",
                  isToday ? "bg-violet-600 font-bold text-white" : has ? "bg-violet-100 font-semibold text-violet-700" : "text-zinc-500"
                )}
              >
                {d}
              </span>
            </div>
          );
        })}
      </div>
    </button>
  );
}

export default function CalendarPage() {
  const { tasks, findBrand } = useData();
  const now = new Date();
  const today = { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() };

  const [view, setView] = useState<"year" | "month">("year");
  const [year, setYear] = useState(today.y);
  const [month, setMonth] = useState(today.m);

  const byDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) (map[t.dueDate] ??= []).push(t);
    return map;
  }, [tasks]);

  const upcoming = tasks
    .filter((t) => t.status !== "done" && daysLeft(t.dueDate) >= 0)
    .sort((a, b) => daysLeft(a.dueDate) - daysLeft(b.dueDate))
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 lg:p-6">
      <PageHeader
        title="Lịch & Nhắc deadline"
        subtitle="Xem deadline theo năm hoặc theo tháng. Hệ thống tự nhắc trước hạn 1 ngày."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-zinc-200 bg-white p-0.5">
              {(["year", "month"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition", view === v ? "bg-violet-600 text-white" : "text-zinc-500 hover:text-zinc-800")}
                >
                  {v === "year" ? "Năm" : "Tháng"}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {view === "year" ? (
            <Card className="p-4">
              {/* Chọn năm */}
              <div className="mb-4 flex items-center justify-center gap-4">
                <button onClick={() => setYear((y) => y - 1)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
                  <IconArrowLeft className="size-5" />
                </button>
                <span className="text-lg font-bold text-zinc-900">Năm {year}</span>
                <button onClick={() => setYear((y) => y + 1)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
                  <IconChevronRight className="size-5" />
                </button>
              </div>
              {/* 12 tháng */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 12 }, (_, m) => (
                  <MiniMonth
                    key={m}
                    year={year}
                    month={m}
                    byDate={byDate}
                    today={today}
                    onOpen={() => { setMonth(m); setView("month"); }}
                  />
                ))}
              </div>
            </Card>
          ) : (
            <Card className="p-4">
              {/* Điều hướng tháng */}
              <div className="mb-3 flex items-center justify-between">
                <button onClick={() => setView("year")} className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700">
                  <IconArrowLeft className="size-4" /> Về năm
                </button>
                <div className="flex items-center gap-3">
                  <button onClick={() => { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); }} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
                    <IconArrowLeft className="size-4" />
                  </button>
                  <span className="text-base font-bold text-zinc-800">{MONTH_NAMES[month]}, {year}</span>
                  <button onClick={() => { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); }} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
                    <IconChevronRight className="size-4" />
                  </button>
                </div>
                <span className="w-16" />
              </div>
              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-400">
                {WEEKDAYS.map((w) => <div key={w}>{w}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {monthCells(year, month).map((d, i) => {
                  if (d === null) return <div key={i} className="min-h-24 rounded-lg bg-zinc-50/50" />;
                  const dayTasks = byDate[iso(year, month, d)] ?? [];
                  const isToday = today.y === year && today.m === month && today.d === d;
                  return (
                    <div key={i} className={cn("min-h-24 rounded-lg border p-1.5", isToday ? "border-violet-300 bg-violet-50" : "border-zinc-100 bg-white")}>
                      <div className={cn("mb-1 text-xs font-medium", isToday ? "text-violet-700" : "text-zinc-500")}>{d}</div>
                      <div className="space-y-1">
                        {dayTasks.slice(0, 3).map((t) => {
                          const brand = findBrand(t.brandId);
                          return (
                            <div key={t.id} className="truncate rounded px-1 py-0.5 text-[10px] font-medium text-white" style={{ background: brand?.color ?? "#7c3aed" }} title={t.title}>
                              {t.title}
                            </div>
                          );
                        })}
                        {dayTasks.length > 3 && <div className="text-[10px] text-zinc-400">+{dayTasks.length - 3}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Nhắc deadline */}
        <Card className="h-fit p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <IconBell className="size-4" />
            </span>
            <h2 className="text-base font-semibold text-zinc-900">Sắp đến hạn</h2>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-zinc-400">Không có deadline sắp tới.</p>
          ) : (
            <div className="space-y-2.5">
              {upcoming.map((t) => {
                const d = daysLeft(t.dueDate);
                const brand = findBrand(t.brandId);
                const assignee = userById(t.assigneeId);
                return (
                  <div key={t.id} className="rounded-xl border border-zinc-100 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-zinc-800">{t.title}</p>
                      {assignee && <Avatar label={assignee.avatar} color={assignee.color} size={24} />}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge className={cn("flex items-center gap-1", d <= 1 ? "bg-rose-100 text-rose-700" : "bg-zinc-100 text-zinc-600")}>
                        <IconClock className="size-3" />
                        {d === 0 ? "Hôm nay" : d === 1 ? "Ngày mai" : `Còn ${d} ngày`}
                      </Badge>
                      <Badge className={PRIORITY_META[t.priority].className}>{PRIORITY_META[t.priority].label}</Badge>
                      {brand && <span className="ml-auto text-xs text-zinc-400">{brand.name}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
