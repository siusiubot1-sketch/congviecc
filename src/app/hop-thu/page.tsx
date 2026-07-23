"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { Avatar, Badge, ChannelChip } from "@/components/ui";
import {
  IconSearch,
  IconSend,
  IconSparkle,
  IconArrowLeft,
  IconUsers,
  IconRobot,
  IconMail,
  IconPaperclip,
  IconClose,
  IconTrash,
} from "@/components/icons";
import {
  conversations as initialConvs,
  users,
  userById,
} from "@/lib/mock-data";
import { useData } from "@/components/DataProvider";
import AddBrandModal from "@/components/AddBrandModal";
import type { Conversation, Channel, ConversationLabel, Message, MailAttachment } from "@/lib/types";
import {
  cn,
  formatTime,
  timeAgo,
  fullDateTime,
  CHANNEL_META,
  CONV_LABEL_META,
} from "@/lib/utils";

const CHANNEL_FILTERS: ("all" | Channel)[] = ["all", "zalo", "gmail"];
const LABEL_OPTIONS: ConversationLabel[] = ["new_lead", "dealing", "won", "spam"];

// Mô phỏng gợi ý trả lời của AI dựa trên nội dung tin cuối
function aiSuggest(conv: Conversation): string {
  const last = conv.messages[conv.messages.length - 1]?.text.toLowerCase() ?? "";
  if (last.includes("báo giá") || last.includes("giá"))
    return "Dạ em gửi anh/chị bảng báo giá mới nhất ạ 📄. Anh/chị cho em xin thông tin chiến dịch (hình thức, thời điểm) để em tư vấn gói phù hợp nhất nhé!";
  if (last.includes("lịch") || last.includes("trống"))
    return "Dạ hiện KOL còn trống các ngày 3, 5, 12, 18/9 ạ. Anh/chị muốn giữ chỗ ngày nào để em xác nhận nhé?";
  if (last.includes("cảm ơn") || last.includes("tốt"))
    return "Dạ em cảm ơn anh/chị nhiều ạ! Rất mong tiếp tục được đồng hành cùng anh/chị trong các chiến dịch sắp tới 🥰";
  return "Dạ em đã nhận được tin nhắn của anh/chị ạ. Em xin phép hỗ trợ ngay, anh/chị vui lòng chờ em một chút nhé!";
}

type GmailMail = {
  id: string;
  threadId: string;
  from: string;
  fromName: string;
  subject: string;
  snippet: string;
  date: string;
  unread: boolean;
  replied: boolean;
};

// Bộ lọc thời gian nhận mail → chuỗi truy vấn Gmail
const TIME_FILTERS: { key: string; label: string; q: string }[] = [
  { key: "all", label: "Tất cả", q: "in:inbox" },
  { key: "1d", label: "Hôm nay", q: "in:inbox newer_than:1d" },
  { key: "7d", label: "7 ngày", q: "in:inbox newer_than:7d" },
  { key: "30d", label: "30 ngày", q: "in:inbox newer_than:30d" },
];

// Chuyển 1 mail Gmail thật thành 1 hội thoại trong hộp thư hợp nhất
function gmailToConversation(m: GmailMail): Conversation {
  const time = (() => {
    const d = new Date(m.date);
    return isNaN(+d) ? new Date().toISOString() : d.toISOString();
  })();
  return {
    id: `gm-${m.id}`,
    channel: "gmail",
    customerName: m.fromName || m.from,
    customerAvatar: (m.fromName || m.from || "?").trim().charAt(0).toUpperCase(),
    customerColor: "#ea4335",
    label: "new_lead",
    unread: m.unread ? 1 : 0,
    lastTime: time,
    real: true,
    externalId: m.id,
    threadId: m.threadId,
    contactEmail: m.from,
    subject: m.subject,
    replied: m.replied,
    messages: [
      {
        id: `gmsg-${m.id}`,
        from: "customer",
        text: `📧 ${m.subject}\n\n${m.snippet}`,
        time,
      },
    ],
  };
}

// Bộ nhớ đệm cấp module: giữ lại danh sách hội thoại + trạng thái Gmail
// giữa các lần rời/quay lại trang, tránh tải lại từ đầu mỗi lần.
let INBOX_CACHE: {
  convs: Conversation[];
  connected: boolean;
  email?: string;
  activeId: string;
  query: string;
  time: number;
} | null = null;
const CACHE_TTL = 90_000; // 90 giây: trong khoảng này quay lại dùng cache, không gọi API

// Lưu bền vững (localStorage): hội thoại mẫu đã sửa/xóa + mail Gmail đã ẩn
const MOCK_CONVS_KEY = "kolhub_inbox_mock_v1";
const DISMISSED_KEY = "kolhub_inbox_dismissed_v1";

// Khung hiển thị email HTML gốc trong iframe cô lập (sandbox, không chạy script)
function EmailFrame({ html }: { html: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(320);
  const srcDoc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank"><style>
    html,body{margin:0;padding:14px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#18181b;font-size:14px;line-height:1.55;word-break:break-word;overflow-x:hidden}
    img{max-width:100%!important;height:auto}
    table{max-width:100%!important}
    a{color:#7c3aed}
  </style></head><body>${html}</body></html>`;

  function onLoad() {
    try {
      const doc = ref.current?.contentWindow?.document;
      if (doc) setHeight(Math.min(1400, doc.documentElement.scrollHeight + 8));
    } catch {
      /* bỏ qua nếu không đọc được */
    }
  }

  return (
    <iframe
      ref={ref}
      srcDoc={srcDoc}
      onLoad={onLoad}
      sandbox="allow-same-origin allow-popups"
      title="Nội dung email"
      className="w-full border-0 bg-white"
      style={{ height }}
    />
  );
}

// Tự động biến URL trong văn bản thành link bấm được (mở tab mới)
function Linkify({ text, linkClassName }: { text: string; linkClassName: string }) {
  const out: React.ReactNode[] = [];
  const re = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    let url = m[0];
    let trail = "";
    const tm = url.match(/[.,;:!?)\]}>"']+$/); // tách dấu câu dính cuối link
    if (tm) {
      trail = tm[0];
      url = url.slice(0, -trail.length);
    }
    const href = url.startsWith("www.") ? `https://${url}` : url;
    out.push(
      <a key={i++} href={href} target="_blank" rel="noreferrer noopener" className={linkClassName}>
        {url}
      </a>
    );
    if (trail) out.push(trail);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

function formatBytes(n: number): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1_048_576) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1_048_576).toFixed(1)} MB`;
}

function attachmentUrl(messageId: string, a: MailAttachment, download = false): string {
  const p = new URLSearchParams({
    messageId,
    attachmentId: a.id,
    mime: a.mimeType,
    filename: a.filename,
  });
  if (download) p.set("download", "1");
  return `/api/gmail/attachment?${p.toString()}`;
}

type FileKind = "image" | "pdf" | "text" | "audio" | "video" | "docx" | "xlsx" | "download";

// Phân loại tệp để chọn cách xem (ưu tiên phần mở rộng, fallback theo mime)
function fileKind(mime: string, filename: string): FileKind {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext)) return "image";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (mime.startsWith("text/") || ["txt", "csv", "log", "md", "json"].includes(ext)) return "text";
  if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a", "aac"].includes(ext)) return "audio";
  if (mime.startsWith("video/") || ["mp4", "mkv", "avi", "mov", "webm"].includes(ext)) return "video";
  if (ext === "docx") return "docx";
  if (ext === "xlsx" || ext === "xls") return "xlsx";
  return "download"; // doc, zip, rar, 7z, exe, ...
}

export default function InboxPage() {
  const { findBrand } = useData();
  const [convs, setConvs] = useState<Conversation[]>(() => INBOX_CACHE?.convs ?? initialConvs);
  const [activeId, setActiveId] = useState<string>(() => INBOX_CACHE?.activeId ?? initialConvs[0]?.id ?? "");
  const [linking, setLinking] = useState(false); // mở modal tạo nhãn hàng từ email
  const [channelFilter, setChannelFilter] = useState<"all" | Channel>("all");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [mobileThread, setMobileThread] = useState(false);
  const [gmail, setGmail] = useState<{ connected: boolean; email?: string; loading: boolean }>(() =>
    INBOX_CACHE
      ? { connected: INBOX_CACHE.connected, email: INBOX_CACHE.email, loading: false }
      : { connected: false, loading: true }
  );
  const [preview, setPreview] = useState<
    { url: string; mime: string; filename: string; kind: FileKind } | null
  >(null);
  const [previewData, setPreviewData] = useState<{ loading: boolean; html?: string; text?: string; error?: string }>({ loading: false });
  const [emailTextMode, setEmailTextMode] = useState(false); // xem email dạng chữ thay vì bản gốc HTML
  const [timeFilter, setTimeFilter] = useState("all"); // lọc mail theo thời gian
  const [customRange, setCustomRange] = useState<{ from: string; to: string }>({ from: "", to: "" });
  const [showCustom, setShowCustom] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [repliedFilter, setRepliedFilter] = useState<"all" | "replied" | "pending">("all");

  function forceReload() {
    if (INBOX_CACHE) INBOX_CACHE.time = 0; // vô hiệu cache → tải lại
    setReloadKey((k) => k + 1);
  }

  // Danh sách mail Gmail đã ẩn (để không kéo về lại khi tải mới)
  const dismissedRef = useRef<Set<string>>(new Set());

  // Ghi bền vững: hội thoại mẫu hiện tại + danh sách đã ẩn
  function persistInbox(nextConvs: Conversation[]) {
    try {
      localStorage.setItem(MOCK_CONVS_KEY, JSON.stringify(nextConvs.filter((c) => !c.real)));
      localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissedRef.current]));
    } catch {
      /* bỏ qua */
    }
  }

  // Nạp trạng thái đã lưu khi mở trang (chạy trước khi gọi Gmail)
  useEffect(() => {
    try {
      const d = localStorage.getItem(DISMISSED_KEY);
      if (d) dismissedRef.current = new Set(JSON.parse(d));
    } catch {
      /* bỏ qua */
    }
    if (!INBOX_CACHE) {
      try {
        const m = localStorage.getItem(MOCK_CONVS_KEY);
        if (m) {
          const mock: Conversation[] = JSON.parse(m);
          setConvs((prev) => [...prev.filter((c) => c.real), ...mock]);
        }
      } catch {
        /* bỏ qua */
      }
    }
  }, []);

  // Xóa hội thoại (ghi nhớ vĩnh viễn)
  function deleteConversation(c: Conversation) {
    if (c.real && c.externalId) dismissedRef.current.add(c.externalId);
    const next = convs.filter((x) => x.id !== c.id);
    setConvs(next);
    persistInbox(next);
  }

  // Tự động làm mới để cập nhật trạng thái "đã trả lời" khi bạn rep trên Gmail:
  // - khi quay lại tab app (focus)
  // - định kỳ mỗi 90 giây (khi tab đang mở)
  useEffect(() => {
    function refreshIfStale() {
      if (!INBOX_CACHE || Date.now() - INBOX_CACHE.time > 30_000) forceReload();
    }
    window.addEventListener("focus", refreshIfStale);
    const timer = setInterval(() => {
      if (!document.hidden) forceReload();
    }, 90_000);
    return () => {
      window.removeEventListener("focus", refreshIfStale);
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Chuỗi truy vấn Gmail theo bộ lọc thời gian
  const gmailQuery = useMemo(() => {
    if (timeFilter === "custom") {
      const parts = ["in:inbox"];
      if (customRange.from) parts.push(`after:${customRange.from.replace(/-/g, "/")}`);
      if (customRange.to) {
        const to = new Date(customRange.to);
        to.setDate(to.getDate() + 1); // gồm cả ngày kết thúc
        parts.push(`before:${to.getFullYear()}/${to.getMonth() + 1}/${to.getDate()}`);
      }
      return parts.join(" ");
    }
    return TIME_FILTERS.find((f) => f.key === timeFilter)?.q ?? "in:inbox";
  }, [timeFilter, customRange]);

  // Mở tệp: xem trực tiếp tối đa các định dạng; loại không đọc được thì tải về
  async function openAttachment(messageId: string, a: MailAttachment) {
    const kind = fileKind(a.mimeType, a.filename);
    const url = attachmentUrl(messageId, a);
    if (kind === "download") {
      window.location.href = attachmentUrl(messageId, a, true);
      return;
    }
    setPreview({ url, mime: a.mimeType, filename: a.filename, kind });
    setPreviewData({ loading: false });

    // Word / Excel / văn bản: cần tải + chuyển đổi để hiển thị
    if (kind === "text" || kind === "docx" || kind === "xlsx") {
      setPreviewData({ loading: true });
      try {
        if (kind === "text") {
          const t = await fetch(url).then((r) => r.text());
          setPreviewData({ loading: false, text: t });
        } else if (kind === "docx") {
          const buf = await fetch(url).then((r) => r.arrayBuffer());
          const mammoth = await import("mammoth");
          const res = await mammoth.convertToHtml({ arrayBuffer: buf });
          setPreviewData({ loading: false, html: res.value });
        } else {
          const buf = await fetch(url).then((r) => r.arrayBuffer());
          const XLSX = await import("xlsx");
          const wb = XLSX.read(buf, { type: "array" });
          const html = wb.SheetNames.map(
            (name) => `<h3 style="margin:12px 0 6px;font-weight:600">${name}</h3>` + XLSX.utils.sheet_to_html(wb.Sheets[name])
          ).join("");
          setPreviewData({ loading: false, html });
        }
      } catch (e) {
        setPreviewData({ loading: false, error: "Không đọc được nội dung tệp. Thử tải về nhé." });
        console.error("preview parse error", e);
      }
    }
  }

  // Giữ cache đồng bộ với state hiện tại (để lần sau quay lại hiện ngay)
  useEffect(() => {
    INBOX_CACHE = {
      convs,
      connected: gmail.connected,
      email: gmail.email,
      activeId,
      query: INBOX_CACHE?.query ?? gmailQuery,
      time: INBOX_CACHE?.time ?? 0,
    };
  }, [convs, gmail, activeId, gmailQuery]);

  // Nạp mail thật từ Gmail theo bộ lọc thời gian.
  // Nếu cache còn mới (cùng bộ lọc, < 90s) thì KHÔNG gọi lại API.
  useEffect(() => {
    const cacheFresh =
      INBOX_CACHE &&
      INBOX_CACHE.query === gmailQuery &&
      Date.now() - INBOX_CACHE.time < CACHE_TTL &&
      INBOX_CACHE.convs.some((c) => c.real);
    if (cacheFresh) {
      setRefreshing(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setRefreshing(true);
      try {
        const st = await fetch("/api/gmail/status").then((r) => r.json());
        if (!st.connected) {
          if (!cancelled) setGmail({ connected: false, loading: false });
          return;
        }
        const data = await fetch(`/api/gmail/messages?q=${encodeURIComponent(gmailQuery)}`).then((r) => r.json());
        const mails: GmailMail[] = data.messages ?? [];
        if (cancelled) return;
        setGmail({ connected: true, email: st.email, loading: false });
        setConvs((prev) => {
          const prevReal = new Map(prev.filter((c) => c.real).map((c) => [c.externalId, c]));
          const nonReal = prev.filter((c) => !c.real);
          // Bỏ qua mail đã ẩn (đã xóa trước đó)
          const visible = mails.filter((m) => !dismissedRef.current.has(m.id));
          // Giữ lại chỉnh sửa cũ (nhãn, phụ trách, liên kết CRM, nội dung đã tải)
          const fresh = visible.map((m) => {
            const base = gmailToConversation(m);
            const old = prevReal.get(m.id);
            if (!old) return base;
            return {
              ...base,
              label: old.label,
              assigneeId: old.assigneeId,
              brandId: old.brandId,
              replied: old.replied || base.replied,
              bodyLoaded: old.bodyLoaded,
              messages: old.bodyLoaded ? old.messages : base.messages,
            };
          });
          return [...fresh, ...nonReal];
        });
        // Đánh dấu cache cho bộ lọc hiện tại
        if (INBOX_CACHE) {
          INBOX_CACHE.query = gmailQuery;
          INBOX_CACHE.time = Date.now();
        }
      } catch {
        if (!cancelled) setGmail({ connected: false, loading: false });
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gmailQuery, reloadKey]);

  const filtered = useMemo(
    () =>
      convs
        .filter((c) => channelFilter === "all" || c.channel === channelFilter)
        .filter((c) => c.customerName.toLowerCase().includes(search.toLowerCase()))
        .filter((c) =>
          repliedFilter === "all"
            ? true
            : repliedFilter === "replied"
            ? c.replied
            : !c.replied
        )
        .sort((a, b) => +new Date(b.lastTime) - +new Date(a.lastTime)),
    [convs, channelFilter, search, repliedFilter]
  );

  const pendingCount = convs.filter((c) => c.real && !c.replied).length;

  const active = convs.find((c) => c.id === activeId) ?? convs[0];
  const brand = findBrand(active?.brandId);

  function updateActive(patch: Partial<Conversation>) {
    const next = convs.map((c) => (c.id === activeId ? { ...c, ...patch } : c));
    setConvs(next);
    persistInbox(next);
  }

  const [sending, setSending] = useState(false);

  async function sendMessage(text: string, from: "agent" | "bot" = "agent") {
    if (!text.trim() || !active) return;
    const msg: Message = {
      id: `m${Date.now()}`,
      from,
      text: text.trim(),
      time: new Date().toISOString(),
      auto: from === "bot",
    };
    // Nếu là mail Gmail thật → gửi qua Gmail API
    if (active.real && active.channel === "gmail" && active.contactEmail) {
      setSending(true);
      try {
        const res = await fetch("/api/gmail/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: active.contactEmail,
            subject: active.subject?.startsWith("Re:") ? active.subject : `Re: ${active.subject ?? ""}`,
            body: text.trim(),
          }),
        });
        if (!res.ok) {
          setSending(false);
          alert("Gửi mail thất bại. Kiểm tra kết nối Gmail.");
          return;
        }
      } catch {
        setSending(false);
        alert("Gửi mail thất bại.");
        return;
      }
      setSending(false);
    }
    updateActive({
      messages: [...active.messages, msg],
      lastTime: msg.time,
      ...(from === "agent" && active.channel === "gmail" ? { replied: true } : {}),
    });
    setDraft("");
    setSuggestion(null);
  }

  // Mở hội thoại: nếu là mail thật chưa tải nội dung → tải đầy đủ
  async function openConversation(c: Conversation) {
    setActiveId(c.id);
    setSuggestion(null);
    setMobileThread(true);
    setEmailTextMode(false);
    setConvs((cs) => cs.map((x) => (x.id === c.id ? { ...x, unread: 0 } : x)));
    if (c.real && c.externalId && !c.bodyLoaded) {
      try {
        const data = await fetch(`/api/gmail/message?id=${c.externalId}`).then((r) => r.json());
        if (data.message?.body) {
          setConvs((cs) =>
            cs.map((x) =>
              x.id === c.id
                ? {
                    ...x,
                    bodyLoaded: true,
                    messages: [
                      {
                        ...x.messages[0],
                        text: data.message.body || `📧 ${x.subject}`,
                        html: data.message.html || undefined,
                        attachments: data.message.attachments ?? [],
                      },
                    ],
                  }
                : x
            )
          );
        }
      } catch {
        /* giữ nguyên snippet nếu tải lỗi */
      }
    }
  }

  const HeaderBar = (
    <div className="flex flex-col gap-2 border-b border-zinc-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Hộp thư hợp nhất</h1>
        <p className="text-sm text-zinc-500">Zalo, Gmail và các kênh khác trong một màn hình.</p>
      </div>
      {gmail.loading ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-500">
          Đang kiểm tra Gmail...
        </span>
      ) : gmail.connected ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
          <IconMail className="size-3.5" /> Gmail thật: {gmail.email}
        </span>
      ) : (
        <Link
          href="/ket-noi"
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100"
        >
          <IconMail className="size-3.5" /> Kết nối Gmail để xem mail thật →
        </Link>
      )}
    </div>
  );

  // Trạng thái rỗng: chưa có hội thoại nào
  if (!active) {
    return (
      <div className="flex h-full flex-col">
        {HeaderBar}
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <span className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-500">
            <IconMail className="size-7" />
          </span>
          <h3 className="text-base font-semibold text-zinc-800">Chưa có tin nhắn nào</h3>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">
            {gmail.connected
              ? "Khi có mail mới, hội thoại sẽ hiện ở đây."
              : "Kết nối Gmail để nhận mail thật vào hộp thư hợp nhất."}
          </p>
          {!gmail.connected && (
            <Link
              href="/ket-noi"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
            >
              <IconMail className="size-4" /> Kết nối kênh
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {HeaderBar}

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[320px_1fr_300px]">
        {/* CỘT 1: Danh sách hội thoại */}
        <div
          className={cn(
            "flex min-h-0 flex-col border-r border-zinc-200 bg-white",
            mobileThread && "hidden lg:flex"
          )}
        >
          <div className="space-y-3 border-b border-zinc-100 p-3">
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm hội thoại..."
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-8 pr-3 text-sm outline-none focus:border-violet-400 focus:bg-white"
              />
            </div>
            <div className="flex gap-1">
              {CHANNEL_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setChannelFilter(f)}
                  className={cn(
                    "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition",
                    channelFilter === f ? "bg-violet-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  )}
                >
                  {f === "all" ? "Tất cả" : CHANNEL_META[f].label}
                </button>
              ))}
            </div>

            {/* Lọc theo thời gian nhận mail */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-400">Thời gian nhận</span>
                <button
                  onClick={forceReload}
                  disabled={refreshing}
                  className="flex items-center gap-1 text-[11px] font-medium text-violet-500 hover:text-violet-700 disabled:opacity-60"
                >
                  <span className={cn(refreshing && "animate-spin")}>⟳</span>
                  {refreshing ? "Đang tải…" : "Làm mới"}
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {TIME_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => { setTimeFilter(f.key); setShowCustom(false); }}
                    className={cn(
                      "rounded-md px-2 py-1 text-xs font-medium transition",
                      timeFilter === f.key ? "bg-violet-100 text-violet-700" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
                <button
                  onClick={() => { setShowCustom((s) => !s); if (timeFilter !== "custom") setTimeFilter("custom"); }}
                  className={cn(
                    "rounded-md px-2 py-1 text-xs font-medium transition",
                    timeFilter === "custom" ? "bg-violet-100 text-violet-700" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                  )}
                >
                  Tùy chọn
                </button>
              </div>
              {showCustom && (
                <div className="mt-2 flex items-center gap-1.5">
                  <input
                    type="date"
                    value={customRange.from}
                    onChange={(e) => { setCustomRange((r) => ({ ...r, from: e.target.value })); setTimeFilter("custom"); }}
                    className="w-full rounded-md border border-zinc-200 px-2 py-1 text-xs outline-none focus:border-violet-400"
                  />
                  <span className="text-xs text-zinc-400">→</span>
                  <input
                    type="date"
                    value={customRange.to}
                    onChange={(e) => { setCustomRange((r) => ({ ...r, to: e.target.value })); setTimeFilter("custom"); }}
                    className="w-full rounded-md border border-zinc-200 px-2 py-1 text-xs outline-none focus:border-violet-400"
                  />
                </div>
              )}
            </div>

            {/* Lọc theo trạng thái trả lời */}
            <div className="flex gap-1">
              {([
                ["all", "Tất cả"],
                ["pending", `Chưa trả lời${pendingCount ? ` (${pendingCount})` : ""}`],
                ["replied", "Đã trả lời"],
              ] as const).map(([key, lb]) => (
                <button
                  key={key}
                  onClick={() => setRepliedFilter(key)}
                  className={cn(
                    "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition",
                    repliedFilter === key
                      ? key === "pending" ? "bg-amber-500 text-white" : key === "replied" ? "bg-emerald-500 text-white" : "bg-zinc-700 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  )}
                >
                  {lb}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {filtered.map((c) => {
              const last = c.messages[c.messages.length - 1];
              return (
                <button
                  key={c.id}
                  onClick={() => openConversation(c)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-zinc-50 p-3 text-left transition hover:bg-zinc-50",
                    c.id === activeId && "bg-violet-50/60"
                  )}
                >
                  <div className="relative">
                    <Avatar label={c.customerAvatar} color={c.customerColor} size={42} />
                    <span
                      className="absolute -bottom-0.5 -right-0.5 inline-flex size-4 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-white"
                      style={{ background: CHANNEL_META[c.channel].color }}
                    >
                      {CHANNEL_META[c.channel].icon}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-sm font-semibold text-zinc-800">{c.customerName}</span>
                      <span className="shrink-0 text-[11px] text-zinc-400" title={fullDateTime(c.lastTime)}>{timeAgo(c.lastTime)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {last.from !== "customer" && <span className="text-violet-500">Bạn: </span>}
                      {last.text}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge className={`ring-1 ring-inset ${CONV_LABEL_META[c.label].className}`}>
                        {CONV_LABEL_META[c.label].label}
                      </Badge>
                      {c.channel === "gmail" && (
                        c.replied ? (
                          <Badge className="bg-emerald-100 text-emerald-700">✓ Đã trả lời</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700">● Chưa trả lời</Badge>
                        )
                      )}
                      {c.unread > 0 && (
                        <span className="inline-flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CỘT 2: Cửa sổ hội thoại */}
        <div className={cn("flex min-h-0 flex-col bg-zinc-50", !mobileThread && "hidden lg:flex")}>
          <div className="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3">
            <button onClick={() => setMobileThread(false)} className="text-zinc-500 lg:hidden">
              <IconArrowLeft className="size-5" />
            </button>
            <Avatar label={active.customerAvatar} color={active.customerColor} size={38} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-zinc-800">{active.customerName}</span>
                {active.channel === "gmail" && (
                  active.replied ? (
                    <Badge className="bg-emerald-100 text-emerald-700">✓ Đã trả lời</Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700">● Chưa trả lời</Badge>
                  )
                )}
              </div>
              <ChannelChip channel={CHANNEL_META[active.channel]} />
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {active.messages.map((m) => {
              const mine = m.from !== "customer";
              const isHtmlEmail = !mine && !!m.html && !emailTextMode;
              return (
                <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div className={isHtmlEmail ? "w-full" : "max-w-[78%]"}>
                    {isHtmlEmail ? (
                      <div className="overflow-hidden rounded-2xl rounded-bl-md border border-zinc-200 bg-white">
                        <div className="flex items-center justify-between gap-2 border-b border-zinc-100 bg-zinc-50 px-3 py-1.5">
                          <span className="truncate text-xs font-medium text-zinc-500">📧 {active.subject}</span>
                          <button
                            onClick={() => setEmailTextMode(true)}
                            className="shrink-0 text-xs font-medium text-violet-600 hover:underline"
                          >
                            Xem dạng chữ
                          </button>
                        </div>
                        <EmailFrame html={m.html!} />
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                          mine
                            ? m.from === "bot"
                              ? "rounded-br-md bg-violet-100 text-violet-900"
                              : "rounded-br-md bg-violet-600 text-white"
                            : "rounded-bl-md border border-zinc-200 bg-white text-zinc-800"
                        )}
                      >
                        {!mine && m.html && emailTextMode && (
                          <button
                            onClick={() => setEmailTextMode(false)}
                            className="mb-1.5 block text-xs font-medium text-violet-600 hover:underline"
                          >
                            ← Xem bản gốc HTML
                          </button>
                        )}
                        <Linkify
                          text={m.text}
                          linkClassName={cn(
                            "underline underline-offset-2 break-all",
                            mine && m.from === "agent" ? "text-white hover:text-white/80" : "text-violet-600 hover:text-violet-700"
                          )}
                        />
                      </div>
                    )}

                    {/* Tệp đính kèm */}
                    {m.attachments && m.attachments.length > 0 && active.externalId && (
                      <div className="mt-2 space-y-2">
                        {(() => {
                          const imgs = m.attachments.filter((a) => a.mimeType.startsWith("image/"));
                          const files = m.attachments!.filter((a) => !a.mimeType.startsWith("image/"));
                          return (
                            <>
                              {imgs.length > 0 && (
                                <div className="grid grid-cols-2 gap-2">
                                  {imgs.map((a) => (
                                    <button
                                      key={a.id}
                                      onClick={() => openAttachment(active.externalId!, a)}
                                      title={a.filename}
                                      className="block overflow-hidden rounded-lg border border-zinc-200"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={attachmentUrl(active.externalId!, a)}
                                        alt={a.filename}
                                        loading="lazy"
                                        className="h-32 w-full bg-zinc-50 object-cover transition hover:scale-[1.03]"
                                      />
                                    </button>
                                  ))}
                                </div>
                              )}
                              {files.map((a) => {
                                const kind = fileKind(a.mimeType, a.filename);
                                const ext = (a.filename.split(".").pop() || "?").toUpperCase().slice(0, 4);
                                const canView = kind !== "download";
                                return (
                                  <button
                                    key={a.id}
                                    onClick={() => openAttachment(active.externalId!, a)}
                                    className="flex w-full items-center gap-2 rounded-lg border border-zinc-200 bg-white p-2 text-left hover:border-violet-300 hover:bg-violet-50/40"
                                  >
                                    <span className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-lg", canView ? "bg-violet-50 text-violet-600" : "bg-zinc-100 text-zinc-500")}>
                                      <span className="text-[8px] font-bold">{ext}</span>
                                    </span>
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate text-xs font-medium text-zinc-700">{a.filename}</span>
                                      <span className="text-[10px] text-zinc-400">{formatBytes(a.size)} · {canView ? "bấm để xem" : "bấm để tải"}</span>
                                    </span>
                                  </button>
                                );
                              })}
                            </>
                          );
                        })()}
                      </div>
                    )}

                    <div className={cn("mt-1 flex items-center gap-1 text-[10px] text-zinc-400", mine ? "justify-end" : "justify-start")}>
                      {m.from === "bot" && <span className="flex items-center gap-0.5 text-violet-500"><IconRobot className="size-3" />Auto-reply</span>}
                      <span title={fullDateTime(m.time)}>{active.real ? fullDateTime(m.time) : formatTime(m.time)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gợi ý AI */}
          {suggestion && (
            <div className="mx-4 mb-2 rounded-xl border border-violet-200 bg-violet-50 p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-violet-700">
                <IconSparkle className="size-4" /> AI gợi ý trả lời (chờ bạn duyệt)
              </div>
              <p className="text-sm text-zinc-700">{suggestion}</p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => sendMessage(suggestion)}
                  className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
                >
                  Duyệt & Gửi
                </button>
                <button
                  onClick={() => setDraft(suggestion)}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => setSuggestion(null)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-600"
                >
                  Bỏ qua
                </button>
              </div>
            </div>
          )}

          {/* Ô soạn tin */}
          <div className="border-t border-zinc-200 bg-white p-3">
            <div className="flex items-end gap-2">
              <button
                onClick={() => setSuggestion(aiSuggest(active))}
                title="Gợi ý trả lời bằng AI"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 hover:bg-violet-100"
              >
                <IconSparkle className="size-5" />
              </button>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(draft);
                  }
                }}
                rows={1}
                placeholder={active.real && active.channel === "gmail" ? "Trả lời email này... (Enter để gửi)" : "Nhập tin nhắn... (Enter để gửi)"}
                className="max-h-28 flex-1 resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:bg-white"
              />
              <button
                onClick={() => sendMessage(draft)}
                disabled={sending}
                title={active.real && active.channel === "gmail" ? "Gửi email qua Gmail" : "Gửi"}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
              >
                <IconSend className="size-5" />
              </button>
            </div>
          </div>
        </div>

        {/* CỘT 3: Thông tin & liên kết CRM */}
        <div className="hidden min-h-0 flex-col overflow-y-auto border-l border-zinc-200 bg-white p-4 lg:flex">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">Thông tin hội thoại</h3>

          {/* Nhãn */}
          <div className="mb-4">
            <div className="mb-1.5 text-xs font-medium text-zinc-400">Nhãn hội thoại</div>
            <div className="flex flex-wrap gap-1.5">
              {LABEL_OPTIONS.map((l) => (
                <button
                  key={l}
                  onClick={() => updateActive({ label: l })}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition",
                    active.label === l
                      ? CONV_LABEL_META[l].className
                      : "bg-white text-zinc-500 ring-zinc-200 hover:bg-zinc-50"
                  )}
                >
                  {CONV_LABEL_META[l].label}
                </button>
              ))}
            </div>
          </div>

          {/* Nhân viên phụ trách */}
          <div className="mb-4">
            <div className="mb-1.5 text-xs font-medium text-zinc-400">Nhân viên phụ trách</div>
            <select
              value={active.assigneeId ?? ""}
              onChange={(e) => updateActive({ assigneeId: e.target.value || undefined })}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
            >
              <option value="">Chưa gán</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            {active.assigneeId && (
              <div className="mt-2 flex items-center gap-2">
                <Avatar label={userById(active.assigneeId)!.avatar} color={userById(active.assigneeId)!.color} size={26} />
                <span className="text-sm text-zinc-600">{userById(active.assigneeId)!.name}</span>
              </div>
            )}
          </div>

          {/* Hồ sơ CRM liên kết */}
          <div className="mb-4">
            <div className="mb-1.5 text-xs font-medium text-zinc-400">Hồ sơ khách hàng liên kết</div>
            {brand ? (
              <Link
                href={`/khach-hang/${brand.id}`}
                className="flex items-center gap-2.5 rounded-xl border border-zinc-200 p-2.5 hover:border-violet-200 hover:bg-violet-50/50"
              >
                <Avatar label={brand.logo} color={brand.color} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-zinc-800">{brand.name}</div>
                  <div className="truncate text-xs text-zinc-400">{brand.industry}</div>
                </div>
              </Link>
            ) : (
              <button
                onClick={() => setLinking(true)}
                className="flex w-full items-center gap-2 rounded-xl border border-dashed border-zinc-300 p-2.5 text-sm text-zinc-500 hover:border-violet-300 hover:bg-violet-50/40"
              >
                <IconUsers className="size-4" /> Tạo hồ sơ nhãn hàng từ hội thoại này
              </button>
            )}
          </div>

          <div className="rounded-xl bg-zinc-50 p-3 text-xs text-zinc-500">
            <div className="mb-1 font-medium text-zinc-600">Tự động hóa</div>
            Bot xử lý theo kịch bản trong mục <span className="font-medium text-violet-600">Kịch bản auto-reply</span>. Chế độ gợi ý sẽ chờ bạn duyệt trước khi gửi.
          </div>

          {/* Xóa hội thoại */}
          <button
            onClick={() => {
              if (confirm(`Xóa hội thoại với "${active.customerName}"?`)) deleteConversation(active);
            }}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-200 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
          >
            <IconTrash className="size-4" /> Xóa hội thoại
          </button>
        </div>
      </div>

      {/* Modal tạo nhãn hàng từ email */}
      {linking && (
        <AddBrandModal
          open
          onClose={() => setLinking(false)}
          title="Tạo hồ sơ nhãn hàng từ hội thoại"
          defaults={{
            name: active.customerName.replace(/\s*[-–].*$/, "").trim(),
            contactName: active.customerName,
            contactEmail: active.contactEmail,
          }}
          onCreated={(b) => updateActive({ brandId: b.id })}
        />
      )}

      {/* Modal xem trực tiếp tệp đính kèm (ảnh / PDF) */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-zinc-900/80 p-3 backdrop-blur-sm sm:p-6"
          onClick={() => setPreview(null)}
        >
          <div
            className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <IconPaperclip className="size-4 shrink-0 text-violet-600" />
                <span className="truncate text-sm font-medium text-zinc-800">{preview.filename}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={`${preview.url}&download=1`}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Tải về
                </a>
                <button
                  onClick={() => setPreview(null)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                >
                  <IconClose className="size-5" />
                </button>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-zinc-100">
              {preview.kind === "image" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.url} alt={preview.filename} className="max-h-full max-w-full object-contain" />
              )}
              {preview.kind === "pdf" && (
                <iframe src={preview.url} title={preview.filename} className="h-full w-full border-0" />
              )}
              {preview.kind === "audio" && (
                <div className="p-6">
                  <audio controls src={preview.url} className="w-[min(90vw,480px)]" />
                </div>
              )}
              {preview.kind === "video" && (
                <video controls src={preview.url} className="max-h-full max-w-full">
                  Trình duyệt không phát được định dạng này. Vui lòng tải về.
                </video>
              )}
              {(preview.kind === "text" || preview.kind === "docx" || preview.kind === "xlsx") && (
                <div className="h-full w-full overflow-auto bg-white p-5">
                  {previewData.loading && <div className="text-sm text-zinc-400">Đang đọc tệp…</div>}
                  {previewData.error && <div className="text-sm text-rose-600">{previewData.error}</div>}
                  {previewData.text !== undefined && (
                    <pre className="whitespace-pre-wrap break-words font-mono text-xs text-zinc-800">{previewData.text}</pre>
                  )}
                  {previewData.html !== undefined && (
                    <div className="doc-preview text-sm text-zinc-800" dangerouslySetInnerHTML={{ __html: previewData.html }} />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
