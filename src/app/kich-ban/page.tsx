"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, Badge } from "@/components/ui";
import {
  IconPlus,
  IconRobot,
  IconSparkle,
  IconClose,
  IconTasks,
  IconSend,
  IconTrash,
} from "@/components/icons";
import { useData } from "@/components/DataProvider";
import type { AutoRule, Channel, RuleTrigger, ReplyMode } from "@/lib/types";
import { cn, CHANNEL_META, REPLY_MODE_META } from "@/lib/utils";

const ALL_CHANNELS: Channel[] = ["zalo", "gmail", "messenger", "tiktok"];

function emptyRule(): AutoRule {
  return {
    id: `r${Date.now()}`,
    name: "",
    enabled: true,
    trigger: "keyword",
    keywords: [],
    intent: "",
    channels: ["zalo"],
    reply: "",
    mode: "suggest",
    hits: 0,
  };
}

// Bảng điều khiển bên phải: form tạo/sửa kịch bản (no-code)
function RuleEditor({
  rule,
  onSave,
  onClose,
}: {
  rule: AutoRule;
  onSave: (r: AutoRule) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<AutoRule>(rule);
  const [kw, setKw] = useState((rule.keywords ?? []).join(", "));

  function toggleChannel(c: Channel) {
    setDraft((d) => ({
      ...d,
      channels: d.channels.includes(c) ? d.channels.filter((x) => x !== c) : [...d.channels, c],
    }));
  }

  function field(label: string, node: React.ReactNode) {
    return (
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-zinc-500">{label}</label>
        {node}
      </div>
    );
  }

  const inputCls =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-900">
            {rule.name ? "Sửa kịch bản" : "Tạo kịch bản mới"}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700">
            <IconClose className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {field(
            "Tên kịch bản",
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="VD: Trả lời khi khách hỏi giá"
              className={inputCls}
            />
          )}

          {field(
            "Điều kiện kích hoạt (IF)",
            <div className="grid grid-cols-2 gap-2">
              {(["keyword", "intent"] as RuleTrigger[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setDraft({ ...draft, trigger: t })}
                  className={cn(
                    "rounded-lg border p-2.5 text-left text-sm transition",
                    draft.trigger === t
                      ? "border-violet-400 bg-violet-50 text-violet-700"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  )}
                >
                  <div className="font-medium">{t === "keyword" ? "Theo từ khóa" : "Theo ý định (AI)"}</div>
                  <div className="mt-0.5 text-[11px] text-zinc-400">
                    {t === "keyword" ? "Khớp chính xác chuỗi" : "AI phân tích ý định"}
                  </div>
                </button>
              ))}
            </div>
          )}

          {draft.trigger === "keyword"
            ? field(
                "Từ khóa (phân tách bằng dấu phẩy)",
                <input
                  value={kw}
                  onChange={(e) => {
                    setKw(e.target.value);
                    setDraft({ ...draft, keywords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) });
                  }}
                  placeholder="giá, bao nhiêu, chi phí"
                  className={inputCls}
                />
              )
            : field(
                "Ý định cần nhận diện",
                <select
                  value={draft.intent}
                  onChange={(e) => setDraft({ ...draft, intent: e.target.value })}
                  className={inputCls}
                >
                  <option value="">Chọn ý định...</option>
                  <option>Xin bảng báo giá</option>
                  <option>Hỏi lịch trống</option>
                  <option>Hỏi giá</option>
                  <option>Đặt lịch / booking</option>
                  <option>Cảm ơn / phản hồi tích cực</option>
                  <option>Khiếu nại</option>
                </select>
              )}

          {field(
            "Áp dụng cho kênh",
            <div className="flex flex-wrap gap-2">
              {ALL_CHANNELS.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleChannel(c)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    draft.channels.includes(c)
                      ? "border-violet-400 bg-violet-50 text-violet-700"
                      : "border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                  )}
                >
                  <span className="inline-flex size-4 items-center justify-center rounded text-[9px] font-bold text-white" style={{ background: CHANNEL_META[c].color }}>
                    {CHANNEL_META[c].icon}
                  </span>
                  {CHANNEL_META[c].label}
                </button>
              ))}
            </div>
          )}

          {field(
            "Nội dung trả lời (THEN)",
            <textarea
              value={draft.reply}
              onChange={(e) => setDraft({ ...draft, reply: e.target.value })}
              rows={4}
              placeholder="Nội dung tin nhắn tự động... Dùng {{ten_bien}} để chèn dữ liệu động."
              className={cn(inputCls, "resize-none")}
            />
          )}

          {field(
            "Chế độ hoạt động",
            <div className="grid grid-cols-2 gap-2">
              {(["suggest", "auto"] as ReplyMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setDraft({ ...draft, mode: m })}
                  className={cn(
                    "rounded-lg border p-2.5 text-left text-sm transition",
                    draft.mode === m
                      ? "border-violet-400 bg-violet-50 text-violet-700"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  )}
                >
                  <div className="font-medium">{m === "suggest" ? "Gợi ý" : "Tự gửi"}</div>
                  <div className="mt-0.5 text-[11px] text-zinc-400">
                    {m === "suggest" ? "Người duyệt rồi mới gửi" : "Bot gửi ngay tự động"}
                  </div>
                </button>
              ))}
            </div>
          )}

          <label className="flex items-center gap-2.5 rounded-lg bg-zinc-50 p-3">
            <input
              type="checkbox"
              checked={!!draft.isTree}
              onChange={(e) => setDraft({ ...draft, isTree: e.target.checked })}
              className="size-4 accent-violet-600"
            />
            <div>
              <div className="text-sm font-medium text-zinc-700">Kịch bản nhiều bước (cây hội thoại)</div>
              <div className="text-[11px] text-zinc-400">Hiển thị menu lựa chọn, dẫn dắt khách qua nhiều bước.</div>
            </div>
          </label>
        </div>

        <div className="flex gap-2 border-t border-zinc-100 p-4">
          <button onClick={onClose} className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
            Hủy
          </button>
          <button
            onClick={() => onSave(draft)}
            disabled={!draft.name.trim() || !draft.reply.trim()}
            className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-40"
          >
            Lưu kịch bản
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ScenariosPage() {
  const { rules, addRule, updateRule, removeRule } = useData();
  const [editing, setEditing] = useState<AutoRule | null>(null);

  function save(r: AutoRule) {
    if (rules.some((x) => x.id === r.id)) updateRule(r.id, r);
    else addRule(r);
    setEditing(null);
  }

  const activeCount = rules.filter((r) => r.enabled).length;
  const totalHits = rules.reduce((s, r) => s + r.hits, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 lg:p-6">
      <PageHeader
        title="Kịch bản auto-reply"
        subtitle="Tạo quy tắc trả lời tự động theo từ khóa hoặc ý định AI — không cần code."
        actions={
          <button
            onClick={() => setEditing(emptyRule())}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
          >
            <IconPlus className="size-4" /> Tạo kịch bản
          </button>
        }
      />

      {/* Tóm tắt */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="text-sm text-zinc-500">Kịch bản đang bật</div>
          <div className="mt-1 text-2xl font-bold text-zinc-900">{activeCount}/{rules.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-zinc-500">Lượt kích hoạt</div>
          <div className="mt-1 text-2xl font-bold text-zinc-900">{totalHits.toLocaleString("vi-VN")}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-zinc-500">Tự gửi / Gợi ý</div>
          <div className="mt-1 text-2xl font-bold text-zinc-900">
            {rules.filter((r) => r.mode === "auto").length}/{rules.filter((r) => r.mode === "suggest").length}
          </div>
        </Card>
      </div>

      {/* Sơ đồ logic minh họa */}
      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Luồng xử lý mỗi tin nhắn đến</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-lg bg-sky-50 px-3 py-2 font-medium text-sky-700">📥 Tin nhắn đến</span>
          <span className="text-zinc-300">→</span>
          <span className="rounded-lg bg-amber-50 px-3 py-2 font-medium text-amber-700">🔍 Khớp từ khóa / Phân tích ý định (AI)</span>
          <span className="text-zinc-300">→</span>
          <span className="rounded-lg bg-violet-50 px-3 py-2 font-medium text-violet-700">🤖 Chọn kịch bản</span>
          <span className="text-zinc-300">→</span>
          <span className="rounded-lg bg-emerald-50 px-3 py-2 font-medium text-emerald-700">✅ Tự gửi hoặc chờ duyệt</span>
        </div>
      </Card>

      {/* Danh sách kịch bản */}
      <div className="space-y-3">
        {rules.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-xl", r.enabled ? "bg-violet-50 text-violet-600" : "bg-zinc-100 text-zinc-400")}>
                {r.isTree ? <IconTasks className="size-5" /> : <IconRobot className="size-5" />}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-zinc-900">{r.name}</h3>
                  {r.isTree && <Badge className="bg-indigo-100 text-indigo-700">Cây hội thoại</Badge>}
                  <Badge className={REPLY_MODE_META[r.mode].className}>{REPLY_MODE_META[r.mode].label}</Badge>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  {r.trigger === "keyword" ? (
                    <span className="flex flex-wrap items-center gap-1">
                      <span className="text-zinc-400">Từ khóa:</span>
                      {r.keywords?.map((k) => (
                        <span key={k} className="rounded bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-600">{k}</span>
                      ))}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <IconSparkle className="size-3.5 text-violet-500" />
                      <span className="text-zinc-400">Ý định:</span>
                      <span className="rounded bg-violet-50 px-1.5 py-0.5 font-medium text-violet-600">{r.intent}</span>
                    </span>
                  )}
                </div>

                <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-zinc-50 p-2.5 text-sm text-zinc-600">
                  <IconSend className="mt-0.5 size-3.5 shrink-0 text-zinc-400" />
                  <span className="line-clamp-2">{r.reply}</span>
                </p>

                <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    Kênh:
                    {r.channels.map((c) => (
                      <span key={c} className="inline-flex size-4 items-center justify-center rounded text-[9px] font-bold text-white" style={{ background: CHANNEL_META[c].color }}>
                        {CHANNEL_META[c].icon}
                      </span>
                    ))}
                  </span>
                  <span>·</span>
                  <span>{r.hits.toLocaleString("vi-VN")} lượt kích hoạt</span>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                {/* Toggle bật/tắt */}
                <button
                  onClick={() => updateRule(r.id, { enabled: !r.enabled })}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition",
                    r.enabled ? "bg-violet-600" : "bg-zinc-300"
                  )}
                >
                  <span className={cn("inline-block size-4 transform rounded-full bg-white transition", r.enabled ? "translate-x-6" : "translate-x-1")} />
                </button>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setEditing(r)}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => { if (confirm(`Xóa kịch bản "${r.name}"?`)) removeRule(r.id); }}
                    title="Xóa"
                    className="rounded-lg border border-rose-200 px-2 py-1.5 text-rose-600 hover:bg-rose-50"
                  >
                    <IconTrash className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {editing && <RuleEditor rule={editing} onSave={save} onClose={() => setEditing(null)} />}
    </div>
  );
}
