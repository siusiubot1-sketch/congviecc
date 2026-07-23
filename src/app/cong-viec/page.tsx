"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Avatar, Badge } from "@/components/ui";
import { IconPlus, IconClock, IconFlag, IconPencil, IconTrash } from "@/components/icons";
import TaskModal from "@/components/TaskModal";
import { useData } from "@/components/DataProvider";
import { userById } from "@/lib/mock-data";
import type { Task, TaskStatus } from "@/lib/types";
import { cn, daysLeft, formatDay, TASK_STATUS_META, PRIORITY_META } from "@/lib/utils";

const COLUMNS: TaskStatus[] = ["todo", "doing", "review", "done"];
const COL_ACCENT: Record<TaskStatus, string> = {
  todo: "border-t-zinc-300",
  doing: "border-t-blue-400",
  review: "border-t-amber-400",
  done: "border-t-emerald-400",
};

function TaskCard({
  task,
  onDragStart,
  onEdit,
  onDelete,
}: {
  task: Task;
  onDragStart: (id: string) => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
}) {
  const { findBrand } = useData();
  const brand = findBrand(task.brandId);
  const assignee = userById(task.assigneeId);
  const d = daysLeft(task.dueDate);
  const overdue = d < 0 && task.status !== "done";
  return (
    <div
      draggable
      onDragStart={() => onDragStart(task.id)}
      className="group cursor-grab rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:shadow-md active:cursor-grabbing"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <Badge className={PRIORITY_META[task.priority].className}>
          <IconFlag className="size-3" />
          {PRIORITY_META[task.priority].label}
        </Badge>
        <div className="flex items-center gap-1">
          <div className="flex gap-0.5 opacity-0 transition group-hover:opacity-100">
            <button onClick={() => onEdit(task)} title="Sửa" className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-violet-600">
              <IconPencil className="size-3.5" />
            </button>
            <button onClick={() => onDelete(task)} title="Xóa" className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-rose-600">
              <IconTrash className="size-3.5" />
            </button>
          </div>
          {brand && (
            <span className="inline-flex size-4 items-center justify-center rounded text-[9px] font-bold text-white" style={{ background: brand.color }}>
              {brand.logo}
            </span>
          )}
        </div>
      </div>
      <p className="text-sm font-medium leading-snug text-zinc-800">{task.title}</p>
      {task.campaign && <p className="mt-1 truncate text-xs text-zinc-400">📁 {task.campaign}</p>}
      <div className="mt-3 flex items-center justify-between">
        <span className={cn("flex items-center gap-1 text-xs", overdue ? "font-medium text-rose-500" : "text-zinc-400")}>
          <IconClock className="size-3.5" />
          {formatDay(task.dueDate)}
          {overdue && " (trễ)"}
        </span>
        {assignee && <Avatar label={assignee.avatar} color={assignee.color} size={24} />}
      </div>
    </div>
  );
}

function KanbanView({
  tasks,
  onMove,
  onEdit,
  onDelete,
  onAdd,
}: {
  tasks: Task[];
  onMove: (id: string, status: TaskStatus) => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onAdd: (status: TaskStatus) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<TaskStatus | null>(null);

  function drop(status: TaskStatus) {
    if (dragId) onMove(dragId, status);
    setDragId(null);
    setOverCol(null);
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {COLUMNS.map((col) => {
        const items = tasks.filter((t) => t.status === col);
        const meta = TASK_STATUS_META[col];
        return (
          <div
            key={col}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(col);
            }}
            onDragLeave={() => setOverCol((c) => (c === col ? null : c))}
            onDrop={() => drop(col)}
            className={cn(
              "flex flex-col rounded-2xl border-t-4 bg-zinc-50/70 p-3 transition-colors",
              COL_ACCENT[col],
              overCol === col && "bg-violet-50 ring-2 ring-violet-200"
            )}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={cn("size-2 rounded-full", meta.dot)} />
                <span className="text-sm font-semibold text-zinc-700">{meta.label}</span>
                <span className="rounded-full bg-zinc-200 px-1.5 text-xs font-medium text-zinc-600">{items.length}</span>
              </div>
              <button onClick={() => onAdd(col)} className="text-zinc-400 hover:text-violet-600">
                <IconPlus className="size-4" />
              </button>
            </div>
            <div className="flex-1 space-y-2.5">
              {items.map((t) => (
                <TaskCard key={t.id} task={t} onDragStart={setDragId} onEdit={onEdit} onDelete={onDelete} />
              ))}
              {items.length === 0 && (
                <div className="rounded-xl border-2 border-dashed border-zinc-200 py-8 text-center text-xs text-zinc-400">
                  Kéo thẻ vào đây
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CalendarView({ tasks, onEdit }: { tasks: Task[]; onEdit: (t: Task) => void }) {
  const { findBrand } = useData();
  const year = 2026;
  const month = 6; // tháng 7
  const first = new Date(year, month, 1);
  const startWeekday = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weekdays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="mb-3 text-center text-base font-semibold text-zinc-800">Tháng 7, 2026</div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-400">
        {weekdays.map((w) => <div key={w}>{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="min-h-24 rounded-lg bg-zinc-50/50" />;
          const iso = `2026-07-${String(day).padStart(2, "0")}`;
          const dayTasks = tasks.filter((t) => t.dueDate === iso);
          const isToday = day === 22;
          return (
            <div key={i} className={cn("min-h-24 rounded-lg border p-1.5 text-left", isToday ? "border-violet-300 bg-violet-50" : "border-zinc-100 bg-white")}>
              <div className={cn("mb-1 text-xs font-medium", isToday ? "text-violet-700" : "text-zinc-500")}>{day}</div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((t) => {
                  const brand = findBrand(t.brandId);
                  return (
                    <button
                      key={t.id}
                      onClick={() => onEdit(t)}
                      className="block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium text-white"
                      style={{ background: brand?.color ?? "#7c3aed" }}
                      title={t.title}
                    >
                      {t.title}
                    </button>
                  );
                })}
                {dayTasks.length > 3 && <div className="px-1 text-[10px] text-zinc-400">+{dayTasks.length - 3} nữa</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { tasks, updateTask, removeTask } = useData();
  const [view, setView] = useState<"kanban" | "calendar">("kanban");
  const [modal, setModal] = useState<{ mode: "add" | "edit"; task?: Task; status?: TaskStatus } | null>(null);

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 lg:p-6">
      <PageHeader
        title="Công việc"
        subtitle="Quản lý, giao việc và theo dõi tiến độ theo nhãn hàng & chiến dịch."
        actions={
          <>
            <div className="flex rounded-xl border border-zinc-200 bg-white p-0.5">
              {(["kanban", "calendar"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition", view === v ? "bg-violet-600 text-white" : "text-zinc-500 hover:text-zinc-800")}
                >
                  {v === "kanban" ? "Kanban" : "Lịch"}
                </button>
              ))}
            </div>
            <button onClick={() => setModal({ mode: "add" })} className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700">
              <IconPlus className="size-4" /> Tạo việc
            </button>
          </>
        }
      />

      {view === "kanban" ? (
        <KanbanView
          tasks={tasks}
          onMove={(id, status) => updateTask(id, { status })}
          onEdit={(t) => setModal({ mode: "edit", task: t })}
          onDelete={(t) => { if (confirm(`Xóa công việc "${t.title}"?`)) removeTask(t.id); }}
          onAdd={(status) => setModal({ mode: "add", status })}
        />
      ) : (
        <CalendarView tasks={tasks} onEdit={(t) => setModal({ mode: "edit", task: t })} />
      )}

      {modal && (
        <TaskModal
          open
          onClose={() => setModal(null)}
          editTask={modal.mode === "edit" ? modal.task : undefined}
          defaultStatus={modal.status ?? "todo"}
        />
      )}
    </div>
  );
}
