"use client";

import { useState } from "react";
import type { Task, TaskStatus, TaskPriority } from "@/lib/types";
import { users } from "@/lib/mock-data";
import { useData, uid } from "./DataProvider";
import { TASK_STATUS_META, PRIORITY_META, cn } from "@/lib/utils";
import { IconClose } from "./icons";

const STATUSES: TaskStatus[] = ["todo", "doing", "review", "done"];
const PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];

export default function TaskModal({
  open,
  onClose,
  editTask,
  defaultStatus = "todo",
}: {
  open: boolean;
  onClose: () => void;
  editTask?: Task;
  defaultStatus?: TaskStatus;
}) {
  const { brands, addTask, updateTask } = useData();
  const [form, setForm] = useState({
    title: editTask?.title ?? "",
    description: editTask?.description ?? "",
    status: editTask?.status ?? defaultStatus,
    priority: editTask?.priority ?? ("medium" as TaskPriority),
    dueDate: editTask?.dueDate ?? "2026-07-25",
    assigneeId: editTask?.assigneeId ?? "u1",
    brandId: editTask?.brandId ?? "",
    campaign: editTask?.campaign ?? "",
  });

  if (!open) return null;
  const input =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100";
  const label = "mb-1.5 block text-xs font-semibold text-zinc-500";

  function submit() {
    if (!form.title.trim()) return;
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate,
      assigneeId: form.assigneeId,
      brandId: form.brandId || undefined,
      campaign: form.campaign.trim() || undefined,
    };
    if (editTask) {
      updateTask(editTask.id, payload);
    } else {
      addTask({ id: uid("task"), createdAt: new Date().toISOString().slice(0, 10), ...payload });
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-900">{editTask ? "Sửa công việc" : "Tạo công việc"}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700">
            <IconClose className="size-5" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <div>
            <label className={label}>Tên công việc *</label>
            <input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="VD: Quay video review sản phẩm" className={input} />
          </div>
          <div>
            <label className={label}>Mô tả</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Chi tiết công việc..." className={cn(input, "resize-none")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Trạng thái</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })} className={input}>
                {STATUSES.map((s) => <option key={s} value={s}>{TASK_STATUS_META[s].label}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Ưu tiên</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })} className={input}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Hạn chót</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className={input} />
            </div>
            <div>
              <label className={label}>Người thực hiện</label>
              <select value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })} className={input}>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Nhãn hàng</label>
              <select value={form.brandId} onChange={(e) => setForm({ ...form, brandId: e.target.value })} className={input}>
                <option value="">— Không —</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Chiến dịch</label>
              <input value={form.campaign} onChange={(e) => setForm({ ...form, campaign: e.target.value })} placeholder="Tên chiến dịch" className={input} />
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-zinc-100 p-4">
          <button onClick={onClose} className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Hủy</button>
          <button onClick={submit} disabled={!form.title.trim()} className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-40">
            {editTask ? "Lưu thay đổi" : "Tạo công việc"}
          </button>
        </div>
      </div>
    </div>
  );
}
