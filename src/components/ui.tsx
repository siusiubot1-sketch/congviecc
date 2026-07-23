import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// ---------------- Avatar ----------------
export function Avatar({
  label,
  color,
  size = 36,
}: {
  label: string;
  color: string;
  size?: number;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none"
      style={{ background: color, width: size, height: size, fontSize: size * 0.4 }}
    >
      {label}
    </span>
  );
}

// ---------------- Badge ----------------
export function Badge({
  children,
  className,
  dot,
}: {
  children: ReactNode;
  className?: string;
  dot?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        className
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dot)} />}
      {children}
    </span>
  );
}

// ---------------- Card ----------------
export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-200/80 bg-white shadow-sm shadow-zinc-200/40",
        className
      )}
    >
      {children}
    </div>
  );
}

// ---------------- Section heading ----------------
export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ---------------- Channel chip ----------------
export function ChannelChip({
  channel,
}: {
  channel: { label: string; icon: string; color: string };
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600">
      <span
        className="inline-flex size-4 items-center justify-center rounded text-[10px] font-bold text-white"
        style={{ background: channel.color }}
      >
        {channel.icon}
      </span>
      {channel.label}
    </span>
  );
}

// ---------------- Progress bar ----------------
export function Progress({ value, color = "#7c3aed" }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, value)}%`, background: color }}
      />
    </div>
  );
}
