import type {
  Channel,
  ConversationLabel,
  BrandStage,
  TaskStatus,
  TaskPriority,
  ReplyMode,
} from "./types";

/** Ghép className có điều kiện (bản rút gọn của clsx) */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** Định dạng tiền VND: 15000000 -> "15.000.000 ₫" */
export function formatVND(value: number): string {
  return value.toLocaleString("vi-VN") + " ₫";
}

/** Rút gọn tiền: 15000000 -> "15 tr", 1200000000 -> "1,2 tỷ" */
export function shortVND(value: number): string {
  if (value >= 1_000_000_000)
    return (value / 1_000_000_000).toFixed(1).replace(".0", "").replace(".", ",") + " tỷ";
  if (value >= 1_000_000)
    return Math.round(value / 1_000_000) + " tr";
  if (value >= 1_000) return Math.round(value / 1_000) + "k";
  return String(value);
}

const DAY = 86_400_000;

/** Khoảng cách thời gian tương đối tiếng Việt (theo thời gian thực) */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const diff = now.getTime() - new Date(iso).getTime();
  if (diff < 0) return "vừa xong"; // mốc thời gian ở tương lai gần
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "vừa xong";
  if (min < 60) return `${min} phút trước`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hôm qua";
  if (days < 7) return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

/** Thời gian đầy đủ để hiển thị khi rê chuột: "23/07/2026 14:30" */
export function fullDateTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Định dạng ngày ngắn: "22/07" */
export function formatDay(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Định dạng giờ: "14:30" */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

/** Số ngày còn lại đến deadline, âm nếu đã quá hạn */
export function daysLeft(iso: string, now = new Date("2026-07-22T10:00:00")): number {
  return Math.ceil((new Date(iso).getTime() - now.getTime()) / DAY);
}

// ---------------- NHÃN & MÀU HIỂN THỊ ----------------

export const CHANNEL_META: Record<Channel, { label: string; icon: string; color: string }> = {
  zalo: { label: "Zalo", icon: "Z", color: "#0068ff" },
  gmail: { label: "Gmail", icon: "M", color: "#ea4335" },
  messenger: { label: "Messenger", icon: "f", color: "#0084ff" },
  tiktok: { label: "TikTok", icon: "T", color: "#000000" },
};

export const CONV_LABEL_META: Record<ConversationLabel, { label: string; className: string }> = {
  new_lead: { label: "Lead mới", className: "bg-sky-100 text-sky-700 ring-sky-200" },
  dealing: { label: "Đang deal", className: "bg-amber-100 text-amber-700 ring-amber-200" },
  won: { label: "Đã chốt", className: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
  spam: { label: "Spam", className: "bg-zinc-100 text-zinc-500 ring-zinc-200" },
};

export const STAGE_META: Record<BrandStage, { label: string; className: string }> = {
  lead: { label: "Tiềm năng", className: "bg-sky-100 text-sky-700 ring-sky-200" },
  dealing: { label: "Đang deal", className: "bg-amber-100 text-amber-700 ring-amber-200" },
  won: { label: "Đã chốt", className: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
  lost: { label: "Đã mất", className: "bg-rose-100 text-rose-600 ring-rose-200" },
};

export const TASK_STATUS_META: Record<TaskStatus, { label: string; className: string; dot: string }> = {
  todo: { label: "Chờ làm", className: "text-zinc-600", dot: "bg-zinc-400" },
  doing: { label: "Đang làm", className: "text-blue-600", dot: "bg-blue-500" },
  review: { label: "Chờ duyệt", className: "text-amber-600", dot: "bg-amber-500" },
  done: { label: "Hoàn thành", className: "text-emerald-600", dot: "bg-emerald-500" },
};

export const PRIORITY_META: Record<TaskPriority, { label: string; className: string }> = {
  low: { label: "Thấp", className: "bg-zinc-100 text-zinc-600" },
  medium: { label: "Trung bình", className: "bg-sky-100 text-sky-700" },
  high: { label: "Cao", className: "bg-orange-100 text-orange-700" },
  urgent: { label: "Khẩn", className: "bg-rose-100 text-rose-700" },
};

export const REPLY_MODE_META: Record<ReplyMode, { label: string; className: string }> = {
  suggest: { label: "Gợi ý (chờ duyệt)", className: "bg-violet-100 text-violet-700" },
  auto: { label: "Tự động gửi", className: "bg-emerald-100 text-emerald-700" },
};
