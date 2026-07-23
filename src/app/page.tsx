import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { Card, Avatar, Badge, ChannelChip } from "@/components/ui";
import { GroupedBars, DonutStat, RankBars } from "@/components/charts";
import {
  IconInbox,
  IconRobot,
  IconClock,
  IconTrend,
  IconChevronRight,
  IconFlag,
} from "@/components/icons";
import {
  tasks,
  conversations,
  dailyStats,
  dealsByBrand,
  brands,
  userById,
} from "@/lib/mock-data";
import {
  shortVND,
  formatVND,
  timeAgo,
  daysLeft,
  CHANNEL_META,
  CONV_LABEL_META,
  PRIORITY_META,
} from "@/lib/utils";

export default function OverviewPage() {
  const totalMsg = dailyStats.reduce((s, d) => s + d.messages, 0);
  const totalAuto = dailyStats.reduce((s, d) => s + d.autoReplied, 0);
  const autoRate = Math.round((totalAuto / totalMsg) * 100);
  const totalDeals = dailyStats.reduce((s, d) => s + d.deals, 0);
  const pipeline = brands.reduce((s, b) => s + b.totalValue, 0);

  const dueSoon = tasks
    .filter((t) => t.status !== "done" && daysLeft(t.dueDate) <= 3)
    .sort((a, b) => daysLeft(a.dueDate) - daysLeft(b.dueDate));

  const recentConvs = [...conversations]
    .sort((a, b) => +new Date(b.lastTime) - +new Date(a.lastTime))
    .slice(0, 5);

  const kpis = [
    { label: "Tin nhắn / tuần", value: totalMsg.toLocaleString("vi-VN"), sub: "+12% so tuần trước", icon: IconInbox, tint: "bg-sky-50 text-sky-600" },
    { label: "Tỉ lệ tự động trả lời", value: `${autoRate}%`, sub: `${totalAuto} tin auto`, icon: IconRobot, tint: "bg-violet-50 text-violet-600" },
    { label: "Tốc độ phản hồi TB", value: "3,2 phút", sub: "-18% nhanh hơn", icon: IconClock, tint: "bg-amber-50 text-amber-600" },
    { label: "Deal chốt / tuần", value: String(totalDeals), sub: `Pipeline ${shortVND(pipeline)}`, icon: IconTrend, tint: "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Tổng quan"
        subtitle="Chào Ngọc Anh 👋 Đây là bức tranh hoạt động của team hôm nay."
      />

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="p-4">
              <div className="flex items-start justify-between">
                <span className={`inline-flex size-9 items-center justify-center rounded-xl ${k.tint}`}>
                  <Icon className="size-5" />
                </span>
              </div>
              <div className="mt-3 text-2xl font-bold tracking-tight text-zinc-900">{k.value}</div>
              <div className="mt-0.5 text-sm text-zinc-500">{k.label}</div>
              <div className="mt-1 text-xs font-medium text-emerald-600">{k.sub}</div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Biểu đồ tin nhắn tuần */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Lưu lượng tin nhắn 7 ngày</h2>
              <p className="text-sm text-zinc-500">Tổng tin nhắn so với tin auto-reply</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-zinc-600"><span className="size-2.5 rounded-sm bg-violet-500" />Tổng</span>
              <span className="flex items-center gap-1.5 text-zinc-600"><span className="size-2.5 rounded-sm bg-emerald-400" />Auto</span>
            </div>
          </div>
          <GroupedBars data={dailyStats.map((d) => ({ label: d.date, a: d.messages, b: d.autoReplied }))} />
        </Card>

        {/* Tỉ lệ auto donut */}
        <Card className="flex flex-col items-center justify-center p-5">
          <h2 className="mb-1 self-start text-base font-semibold text-zinc-900">Mức độ tự động hóa</h2>
          <p className="mb-4 self-start text-sm text-zinc-500">Tuần này</p>
          <DonutStat percent={autoRate} label="tự động" />
          <div className="mt-4 grid w-full grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-zinc-50 p-2.5">
              <div className="text-lg font-bold text-zinc-900">{totalAuto}</div>
              <div className="text-xs text-zinc-500">Tin auto</div>
            </div>
            <div className="rounded-xl bg-zinc-50 p-2.5">
              <div className="text-lg font-bold text-zinc-900">{totalMsg - totalAuto}</div>
              <div className="text-xs text-zinc-500">Tin thủ công</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Công việc sắp đến hạn */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900">Việc sắp đến hạn</h2>
            <Link href="/cong-viec" className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700">
              Xem tất cả <IconChevronRight className="size-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {dueSoon.map((t) => {
              const d = daysLeft(t.dueDate);
              const overdue = d < 0;
              const brand = brands.find((b) => b.id === t.brandId);
              const assignee = userById(t.assigneeId);
              return (
                <div key={t.id} className="flex items-center gap-3 rounded-xl border border-zinc-100 p-3 hover:bg-zinc-50">
                  <span className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${overdue ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>
                    <IconFlag className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-zinc-800">{t.title}</div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      {brand && <span>{brand.name}</span>}
                      {brand && <span>·</span>}
                      <span className={overdue ? "font-medium text-rose-500" : "text-zinc-400"}>
                        {overdue ? `Quá hạn ${-d} ngày` : d === 0 ? "Hôm nay" : `Còn ${d} ngày`}
                      </span>
                    </div>
                  </div>
                  <Badge className={PRIORITY_META[t.priority].className}>{PRIORITY_META[t.priority].label}</Badge>
                  {assignee && <Avatar label={assignee.avatar} color={assignee.color} size={28} />}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Doanh thu theo nhãn hàng */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900">Deal theo nhãn hàng</h2>
          </div>
          <RankBars data={dealsByBrand} format={shortVND} />
          <div className="mt-4 border-t border-zinc-100 pt-3 text-sm text-zinc-500">
            Tổng giá trị: <span className="font-semibold text-zinc-800">{formatVND(pipeline)}</span>
          </div>
        </Card>
      </div>

      {/* Hộp thư gần đây */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900">Tin nhắn gần đây</h2>
          <Link href="/hop-thu" className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700">
            Mở hộp thư <IconChevronRight className="size-4" />
          </Link>
        </div>
        <div className="divide-y divide-zinc-100">
          {recentConvs.map((c) => {
            const last = c.messages[c.messages.length - 1];
            return (
              <Link href="/hop-thu" key={c.id} className="flex items-center gap-3 py-3 hover:bg-zinc-50">
                <Avatar label={c.customerAvatar} color={c.customerColor} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-zinc-800">{c.customerName}</span>
                    <ChannelChip channel={CHANNEL_META[c.channel]} />
                  </div>
                  <div className="truncate text-sm text-zinc-500">
                    {last.from === "bot" && <span className="text-violet-500">🤖 </span>}
                    {last.text}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-xs text-zinc-400">{timeAgo(c.lastTime)}</span>
                  <Badge className={`ring-1 ring-inset ${CONV_LABEL_META[c.label].className}`}>
                    {CONV_LABEL_META[c.label].label}
                  </Badge>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
