import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui";
import { GroupedBars, LineChart, RankBars, DonutStat } from "@/components/charts";
import { dailyStats, dealsByBrand, brands, users } from "@/lib/mock-data";
import { shortVND, formatVND } from "@/lib/utils";

export default function ReportsPage() {
  const totalMsg = dailyStats.reduce((s, d) => s + d.messages, 0);
  const totalAuto = dailyStats.reduce((s, d) => s + d.autoReplied, 0);
  const autoRate = Math.round((totalAuto / totalMsg) * 100);
  const totalDeals = dailyStats.reduce((s, d) => s + d.deals, 0);
  const pipeline = brands.reduce((s, b) => s + b.totalValue, 0);

  // Tốc độ phản hồi (phút) mô phỏng theo ngày
  const responseSpeed = [5.1, 4.6, 4.2, 3.8, 3.4, 3.6, 3.2];

  // Deal chốt theo nhân viên
  const dealsByStaff = users.map((u) => ({
    name: u.name,
    value: brands.filter((b) => b.ownerId === u.id && b.stage === "won").reduce((s, b) => s + b.totalValue, 0),
    color: u.color,
  })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 lg:p-6">
      <PageHeader
        title="Báo cáo"
        subtitle="Hiệu suất tin nhắn, tự động hóa và doanh số theo nhãn hàng."
        actions={
          <div className="flex rounded-xl border border-zinc-200 bg-white p-0.5 text-sm">
            <button className="rounded-lg px-3 py-1.5 font-medium text-zinc-500">Tháng</button>
            <button className="rounded-lg bg-violet-600 px-3 py-1.5 font-medium text-white">Tuần</button>
            <button className="rounded-lg px-3 py-1.5 font-medium text-zinc-500">Ngày</button>
          </div>
        }
      />

      {/* KPI tóm tắt */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Tổng tin nhắn", value: totalMsg.toLocaleString("vi-VN"), sub: "7 ngày qua" },
          { label: "Tỉ lệ auto-reply", value: `${autoRate}%`, sub: `${totalAuto} tin tự động` },
          { label: "Tốc độ phản hồi TB", value: "3,2 phút", sub: "cải thiện 18%" },
          { label: "Doanh số chốt", value: shortVND(pipeline), sub: `${totalDeals} deal` },
        ].map((k) => (
          <Card key={k.label} className="p-4">
            <div className="text-sm text-zinc-500">{k.label}</div>
            <div className="mt-1 text-2xl font-bold text-zinc-900">{k.value}</div>
            <div className="mt-0.5 text-xs text-emerald-600">{k.sub}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-1 text-base font-semibold text-zinc-900">Số tin nhắn / ngày</h2>
          <p className="mb-4 text-sm text-zinc-500">Tổng tin nhắn (tím) và tin auto-reply (xanh)</p>
          <GroupedBars data={dailyStats.map((d) => ({ label: d.date, a: d.messages, b: d.autoReplied }))} height={220} />
        </Card>

        <Card className="flex flex-col items-center justify-center p-5">
          <h2 className="mb-1 self-start text-base font-semibold text-zinc-900">Tỉ lệ tự động trả lời</h2>
          <p className="mb-4 self-start text-sm text-zinc-500">Trung bình tuần</p>
          <DonutStat percent={autoRate} label="auto" color="#7c3aed" />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-1 text-base font-semibold text-zinc-900">Tốc độ phản hồi trung bình</h2>
          <p className="mb-4 text-sm text-zinc-500">Đơn vị: phút (càng thấp càng tốt)</p>
          <LineChart data={responseSpeed} color="#0891b2" />
          <div className="mt-2 flex justify-between text-xs text-zinc-400">
            {dailyStats.map((d) => <span key={d.date}>{d.date}</span>)}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-1 text-base font-semibold text-zinc-900">Số deal chốt / ngày</h2>
          <p className="mb-4 text-sm text-zinc-500">Số hợp đồng chốt trong tuần</p>
          <LineChart data={dailyStats.map((d) => d.deals)} color="#059669" />
          <div className="mt-2 flex justify-between text-xs text-zinc-400">
            {dailyStats.map((d) => <span key={d.date}>{d.date}</span>)}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">Doanh số theo nhãn hàng</h2>
          <RankBars data={dealsByBrand} format={shortVND} />
          <div className="mt-4 border-t border-zinc-100 pt-3 text-sm text-zinc-500">
            Tổng: <span className="font-semibold text-zinc-800">{formatVND(pipeline)}</span>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">Doanh số theo nhân viên</h2>
          <RankBars data={dealsByStaff} format={shortVND} />
        </Card>
      </div>
    </div>
  );
}
