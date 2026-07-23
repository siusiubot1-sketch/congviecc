import { google } from "googleapis";

// ============================================================
// Tích hợp Gmail API (OAuth2) — đọc & gửi mail
// Token được lưu ở cookie httpOnly "gmail_tokens" (JSON).
// ============================================================

export const GMAIL_COOKIE = "gmail_tokens";

export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "openid",
  "email",
  "profile",
];

/** Đã cấu hình Client ID/Secret trong biến môi trường chưa? */
export function isConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function redirectUri(): string {
  return (
    process.env.GOOGLE_REDIRECT_URI ??
    `${process.env.APP_URL ?? "http://localhost:3000"}/api/gmail/callback`
  );
}

export function oauthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri()
  );
}

/** URL đưa người dùng tới trang đồng ý của Google */
export function getAuthUrl(): string {
  return oauthClient().generateAuthUrl({
    access_type: "offline", // để nhận refresh_token
    prompt: "consent",
    scope: GMAIL_SCOPES,
  });
}

export type StoredTokens = {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
  scope?: string;
  token_type?: string | null;
};

/** Đổi authorization code lấy token */
export async function exchangeCode(code: string): Promise<StoredTokens> {
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  return tokens as StoredTokens;
}

/** Tạo client đã xác thực từ token đã lưu (tự refresh khi hết hạn) */
export function authedClient(tokens: StoredTokens) {
  const client = oauthClient();
  client.setCredentials(tokens);
  return client;
}

export interface MailSummary {
  id: string;
  threadId: string;
  from: string;
  fromName: string;
  subject: string;
  snippet: string;
  date: string;
  unread: boolean;
  replied: boolean; // trong thread đã có tin mình gửi chưa
}

function header(headers: { name?: string | null; value?: string | null }[], name: string): string {
  return headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function parseFrom(raw: string): { name: string; email: string } {
  const m = raw.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>/);
  if (m) return { name: m[1].trim() || m[2], email: m[2] };
  return { name: raw, email: raw };
}

/** Lấy danh sách mail gần đây (mặc định hộp thư đến) */
export async function listMessages(
  tokens: StoredTokens,
  max = 15,
  query = "in:inbox"
): Promise<MailSummary[]> {
  const gmail = google.gmail({ version: "v1", auth: authedClient(tokens) });
  const list = await gmail.users.messages.list({ userId: "me", maxResults: max, q: query });
  const ids = list.data.messages ?? [];

  const details = await Promise.all(
    ids.map((m) =>
      gmail.users.messages.get({
        userId: "me",
        id: m.id!,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"],
      })
    )
  );

  // Kiểm tra "đã trả lời": thread có chứa tin mình đã gửi (label SENT) không
  const threadIds = [...new Set(details.map((d) => d.data.threadId!).filter(Boolean))];
  const repliedByThread = new Map<string, boolean>();
  await Promise.all(
    threadIds.map(async (tid) => {
      try {
        const th = await gmail.users.threads.get({ userId: "me", id: tid, format: "minimal" });
        const replied = (th.data.messages ?? []).some((mm) => (mm.labelIds ?? []).includes("SENT"));
        repliedByThread.set(tid, replied);
      } catch {
        repliedByThread.set(tid, false);
      }
    })
  );

  return details.map((d) => {
    const msg = d.data;
    const headers = msg.payload?.headers ?? [];
    const from = parseFrom(header(headers, "From"));
    return {
      id: msg.id!,
      threadId: msg.threadId!,
      from: from.email,
      fromName: from.name,
      subject: header(headers, "Subject") || "(không tiêu đề)",
      snippet: msg.snippet ?? "",
      date: header(headers, "Date"),
      unread: (msg.labelIds ?? []).includes("UNREAD"),
      replied: repliedByThread.get(msg.threadId!) ?? false,
    };
  });
}

function decodeB64(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function walkParts(payload: any, out: { plain?: string; html?: string }) {
  if (!payload) return;
  const mt: string = payload.mimeType ?? "";
  if (payload.body?.data) {
    const text = decodeB64(payload.body.data);
    if (mt === "text/plain" && !out.plain) out.plain = text;
    else if (mt === "text/html" && !out.html) out.html = text;
  }
  (payload.parts ?? []).forEach((p: any) => walkParts(p, out));
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Chuyển HTML thành text đọc được (bỏ tag, comment, ký tự ẩn) */
function stripHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<(head|title)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&zwnj;/gi, "")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#8203;/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Trích nội dung mail: trả về cả text sạch và HTML gốc (nếu có) */
export function extractContent(payload: unknown): { text: string; html: string } {
  const out: { plain?: string; html?: string } = {};
  walkParts(payload, out);
  let html = out.html ?? "";
  let plain = out.plain ?? "";
  // Một số email nhét HTML vào phần text/plain → coi như HTML
  if (!html && /<[a-z!/][^>]*>/i.test(plain)) {
    html = plain;
    plain = "";
  }
  const text = plain.trim() || stripHtml(html);
  return { text, html };
}

/** Trích text đọc được (giữ lại để tương thích) */
export function extractBody(payload: unknown): string {
  return extractContent(payload).text;
}

export interface AttachmentMeta {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function collectAttachments(payload: any, out: AttachmentMeta[]) {
  if (!payload) return;
  const attId: string | undefined = payload.body?.attachmentId;
  const mt: string = payload.mimeType ?? "";
  if (attId && (payload.filename || mt.startsWith("image/"))) {
    out.push({
      id: attId,
      filename: payload.filename || `anh.${mt.split("/")[1] ?? "bin"}`,
      mimeType: mt || "application/octet-stream",
      size: payload.body?.size ?? 0,
    });
  }
  (payload.parts ?? []).forEach((p: any) => collectAttachments(p, out));
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Lấy 1 mail đầy đủ (kèm nội dung + danh sách đính kèm) theo id */
export async function getMessage(tokens: StoredTokens, id: string) {
  const gmail = google.gmail({ version: "v1", auth: authedClient(tokens) });
  const res = await gmail.users.messages.get({ userId: "me", id, format: "full" });
  const msg = res.data;
  const headers = msg.payload?.headers ?? [];
  const from = parseFrom(header(headers, "From"));
  const attachments: AttachmentMeta[] = [];
  collectAttachments(msg.payload, attachments);
  const { text, html } = extractContent(msg.payload);
  return {
    id: msg.id!,
    threadId: msg.threadId!,
    from: from.email,
    fromName: from.name,
    subject: header(headers, "Subject") || "(không tiêu đề)",
    date: header(headers, "Date"),
    body: text || msg.snippet || "",
    html,
    attachments,
  };
}

/** Tải nội dung nhị phân của 1 tệp đính kèm */
export async function getAttachment(
  tokens: StoredTokens,
  messageId: string,
  attachmentId: string
): Promise<Buffer> {
  const gmail = google.gmail({ version: "v1", auth: authedClient(tokens) });
  const res = await gmail.users.messages.attachments.get({
    userId: "me",
    messageId,
    id: attachmentId,
  });
  const data = res.data.data ?? "";
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

/** Lấy địa chỉ email tài khoản đang kết nối */
export async function getProfileEmail(tokens: StoredTokens): Promise<string> {
  const gmail = google.gmail({ version: "v1", auth: authedClient(tokens) });
  const res = await gmail.users.getProfile({ userId: "me" });
  return res.data.emailAddress ?? "";
}

/** Gửi email (plain text) */
export async function sendMessage(
  tokens: StoredTokens,
  to: string,
  subject: string,
  body: string
): Promise<string> {
  const gmail = google.gmail({ version: "v1", auth: authedClient(tokens) });
  // Mã hóa tiêu đề UTF-8 theo RFC 2047 để hỗ trợ tiếng Việt
  const encSubject = `=?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`;
  const raw = [
    `To: ${to}`,
    `Subject: ${encSubject}`,
    "Content-Type: text/plain; charset=UTF-8",
    "MIME-Version: 1.0",
    "",
    body,
  ].join("\r\n");
  const encodedMessage = Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encodedMessage },
  });
  return res.data.id ?? "";
}
