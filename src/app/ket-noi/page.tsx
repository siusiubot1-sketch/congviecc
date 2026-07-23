"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { Card, Badge } from "@/components/ui";
import {
  IconMail,
  IconLink,
  IconSend,
  IconClose,
  IconRobot,
  IconStar,
} from "@/components/icons";
import { cn, CHANNEL_META } from "@/lib/utils";

type Status = { configured: boolean; connected: boolean; email?: string };
type Mail = {
  id: string;
  from: string;
  fromName: string;
  subject: string;
  snippet: string;
  date: string;
  unread: boolean;
};

function ConnectFeedback() {
  const sp = useSearchParams();
  const connected = sp.get("connected");
  const error = sp.get("error");
  if (!connected && !error) return null;
  const map: Record<string, string> = {
    config: "Chưa cấu hình GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET trong .env.local.",
    no_code: "Google không trả về mã xác thực. Thử lại.",
    exchange: "Đổi mã lấy token thất bại. Kiểm tra Client Secret & Redirect URI.",
    access_denied: "Bạn đã từ chối cấp quyền.",
  };
  return connected ? (
    <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
      ✓ Đã kết nối Gmail thành công!
    </div>
  ) : (
    <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
      ✕ {map[error!] ?? `Lỗi: ${error}`}
    </div>
  );
}

function GmailCard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [mails, setMails] = useState<Mail[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [compose, setCompose] = useState(false);
  const [form, setForm] = useState({ to: "", subject: "", body: "" });
  const [sendState, setSendState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const loadStatus = useCallback(async () => {
    const res = await fetch("/api/gmail/status");
    setStatus(await res.json());
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  async function loadMails() {
    setLoading(true);
    const res = await fetch("/api/gmail/messages");
    const data = await res.json();
    setMails(data.messages ?? []);
    setLoading(false);
  }

  async function disconnect() {
    await fetch("/api/gmail/disconnect", { method: "POST" });
    setMails(null);
    loadStatus();
  }

  async function send() {
    setSendState("sending");
    const res = await fetch("/api/gmail/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSendState(res.ok ? "sent" : "error");
    if (res.ok) setForm({ to: "", subject: "", body: "" });
  }

  const connected = status?.connected;

  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl text-white" style={{ background: CHANNEL_META.gmail.color }}>
          <IconMail className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-zinc-900">Gmail</h3>
            {connected ? (
              <Badge className="bg-emerald-100 text-emerald-700" dot="bg-emerald-500">Đã kết nối</Badge>
            ) : status?.configured ? (
              <Badge className="bg-zinc-100 text-zinc-500">Chưa kết nối</Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-700">Chưa cấu hình</Badge>
            )}
          </div>
          <p className="mt-0.5 text-sm text-zinc-500">
            {connected
              ? `Đang đọc & gửi mail qua ${status?.email}`
              : "Đọc và gửi email trực tiếp trong hộp thư hợp nhất."}
          </p>
        </div>
        <div className="shrink-0">
          {connected ? (
            <button onClick={disconnect} className="rounded-xl border border-zinc-200 px-3.5 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
              Ngắt kết nối
            </button>
          ) : status?.configured ? (
            <a href="/api/gmail/connect" className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
              <IconLink className="size-4" /> Kết nối Gmail
            </a>
          ) : (
            <span className="text-xs text-zinc-400">Xem hướng dẫn bên dưới</span>
          )}
        </div>
      </div>

      {!status?.configured && (
        <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          <div className="font-semibold">Cần cấu hình trước khi kết nối:</div>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-amber-800">
            <li>Tạo project tại <span className="font-medium">Google Cloud Console</span> → bật <span className="font-medium">Gmail API</span>.</li>
            <li>Tạo <span className="font-medium">OAuth Client ID</span> (loại Web), thêm Redirect URI: <code className="rounded bg-white px-1">http://localhost:3000/api/gmail/callback</code></li>
            <li>Điền vào file <code className="rounded bg-white px-1">.env.local</code>: <code className="rounded bg-white px-1">GOOGLE_CLIENT_ID</code>, <code className="rounded bg-white px-1">GOOGLE_CLIENT_SECRET</code></li>
            <li>Khởi động lại server. Chi tiết ở <span className="font-medium">GMAIL-SETUP.md</span>.</li>
          </ol>
        </div>
      )}

      {connected && (
        <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
          <div className="flex flex-wrap gap-2">
            <button onClick={loadMails} className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-violet-700">
              <IconMail className="size-4" /> {loading ? "Đang tải..." : "Tải mail gần đây"}
            </button>
            <button onClick={() => setCompose((c) => !c)} className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3.5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              <IconSend className="size-4" /> Soạn & gửi thử
            </button>
          </div>

          {compose && (
            <div className="space-y-2 rounded-xl border border-zinc-200 p-3">
              <input
                placeholder="Đến (email)"
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
              />
              <input
                placeholder="Tiêu đề"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
              />
              <textarea
                placeholder="Nội dung..."
                rows={3}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={send}
                  disabled={sendState === "sending" || !form.to || !form.subject}
                  className="rounded-lg bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-40"
                >
                  {sendState === "sending" ? "Đang gửi..." : "Gửi email"}
                </button>
                {sendState === "sent" && <span className="text-sm font-medium text-emerald-600">✓ Đã gửi!</span>}
                {sendState === "error" && <span className="text-sm font-medium text-rose-600">✕ Gửi thất bại</span>}
              </div>
            </div>
          )}

          {mails && (
            <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-100">
              {mails.length === 0 && <div className="p-4 text-sm text-zinc-400">Không có mail nào.</div>}
              {mails.map((m) => (
                <div key={m.id} className="flex items-start gap-3 p-3">
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", m.unread ? "bg-violet-500" : "bg-transparent")} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("truncate text-sm", m.unread ? "font-semibold text-zinc-900" : "text-zinc-700")}>{m.fromName}</span>
                      <span className="shrink-0 text-xs text-zinc-400">{new Date(m.date).toLocaleDateString("vi-VN")}</span>
                    </div>
                    <div className="truncate text-sm font-medium text-zinc-700">{m.subject}</div>
                    <div className="truncate text-xs text-zinc-400">{m.snippet}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function ComingSoonCard({ channel, desc }: { channel: "zalo" | "messenger" | "tiktok"; desc: string }) {
  const meta = CHANNEL_META[channel];
  return (
    <Card className="p-5 opacity-90">
      <div className="flex items-start gap-4">
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl text-white" style={{ background: meta.color }}>
          <span className="text-lg font-bold">{meta.icon}</span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-zinc-900">{meta.label}</h3>
            <Badge className="bg-zinc-100 text-zinc-500">Sắp có</Badge>
          </div>
          <p className="mt-0.5 text-sm text-zinc-500">{desc}</p>
        </div>
        <button disabled className="shrink-0 cursor-not-allowed rounded-xl border border-zinc-200 px-3.5 py-2 text-sm font-medium text-zinc-400">
          Kết nối
        </button>
      </div>
    </Card>
  );
}

export default function IntegrationsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 lg:p-6">
      <PageHeader
        title="Kết nối kênh"
        subtitle="Tích hợp Gmail, Zalo và các kênh khác vào hộp thư hợp nhất."
      />

      <Suspense fallback={null}>
        <ConnectFeedback />
      </Suspense>

      <div className="space-y-3">
        <GmailCard />
        <ComingSoonCard channel="zalo" desc="Nhận & gửi tin nhắn qua Zalo Official Account API." />
        <ComingSoonCard channel="messenger" desc="Kết nối Fanpage Facebook Messenger." />
        <ComingSoonCard channel="tiktok" desc="Nhận tin nhắn & bình luận từ TikTok." />
      </div>

      <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-violet-700">
          <IconRobot className="size-4" /> Sau khi kết nối
        </div>
        <p className="mt-1.5 text-sm text-zinc-600">
          Mọi mail/tin nhắn sẽ tự đổ về <span className="font-medium">Hộp thư hợp nhất</span>, khớp kịch bản{" "}
          <span className="font-medium">auto-reply</span> và tự liên kết hồ sơ khách hàng.
        </p>
      </Card>
    </div>
  );
}
