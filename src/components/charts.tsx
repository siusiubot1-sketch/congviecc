// Biểu đồ SVG thuần, không phụ thuộc thư viện ngoài
import { cn } from "@/lib/utils";

// ---------------- Biểu đồ cột nhóm (tin nhắn vs auto-reply) ----------------
export function GroupedBars({
  data,
  height = 200,
}: {
  data: { label: string; a: number; b: number }[];
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.a)) * 1.15;
  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-2" style={{ height }}>
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-1">
            <div className="flex w-full items-end justify-center gap-1" style={{ height: height - 24 }}>
              <div className="group relative flex w-3 items-end sm:w-4">
                <div
                  className="w-full rounded-t bg-violet-500 transition-all"
                  style={{ height: `${(d.a / max) * (height - 24)}px` }}
                />
                <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                  {d.a}
                </span>
              </div>
              <div className="flex w-3 items-end sm:w-4">
                <div
                  className="w-full rounded-t bg-emerald-400 transition-all"
                  style={{ height: `${(d.b / max) * (height - 24)}px` }}
                />
              </div>
            </div>
            <span className="text-xs text-zinc-400">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Biểu đồ đường mượt (tốc độ phản hồi / deal) ----------------
export function LineChart({
  data,
  height = 160,
  color = "#7c3aed",
}: {
  data: number[];
  height?: number;
  color?: string;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 300;
  const pad = 8;
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return [x, y];
  });
  const path = pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(" ");
  const area = `${path} L ${pts[pts.length - 1][0]} ${height} L ${pts[0][0]} ${height} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lg)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="white" stroke={color} strokeWidth="2" />
      ))}
    </svg>
  );
}

// ---------------- Vòng tròn tiến độ (donut đơn) ----------------
export function DonutStat({
  percent,
  label,
  color = "#7c3aed",
  size = 120,
}: {
  percent: number;
  label: string;
  color?: string;
  size?: number;
}) {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const off = c - (percent / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f1f4" strokeWidth="10" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-zinc-900">{percent}%</span>
        <span className="text-[11px] text-zinc-400">{label}</span>
      </div>
    </div>
  );
}

// ---------------- Thanh ngang xếp hạng (deal theo nhãn hàng) ----------------
export function RankBars({
  data,
  format,
}: {
  data: { name: string; value: number; color: string }[];
  format: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.name}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-zinc-700">{d.name}</span>
            <span className="tabular-nums text-zinc-500">{format(d.value)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className={cn("h-full rounded-full transition-all")}
              style={{ width: `${(d.value / max) * 100}%`, background: d.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
