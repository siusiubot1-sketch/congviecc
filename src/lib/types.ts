// ============================================================
// Kiểu dữ liệu dùng chung cho toàn bộ ứng dụng quản lý KOL/KOC
// (Ánh xạ gần đúng với sơ đồ database - xem README/kiến trúc)
// ============================================================

export type Role = "admin" | "staff";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string; // ký tự viết tắt hiển thị avatar
  color: string; // màu nền avatar
}

// ---------------- CÔNG VIỆC ----------------
export type TaskStatus = "todo" | "doing" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string; // ISO
  assigneeId: string;
  brandId?: string;
  campaign?: string;
  createdAt: string;
}

// ---------------- CRM: NHÃN HÀNG / KHÁCH HÀNG ----------------
export type BrandStage = "lead" | "dealing" | "won" | "lost";

export interface Contact {
  name: string;
  role: string;
  phone?: string;
  email?: string;
}

export interface Booking {
  id: string;
  campaign: string;
  date: string; // ISO
  value: number; // VND
  status: "pending" | "signed" | "done";
}

export type TimelineType = "note" | "message" | "booking" | "task" | "call";

export interface TimelineEvent {
  id: string;
  type: TimelineType;
  content: string;
  date: string; // ISO
  authorId?: string;
}

export interface Brand {
  id: string;
  name: string;
  industry: string;
  logo: string; // ký tự viết tắt
  color: string;
  stage: BrandStage;
  contacts: Contact[];
  ownerId: string; // nhân viên phụ trách
  totalValue: number; // tổng giá trị hợp đồng VND
  note?: string;
  attachments: { name: string; size: string }[];
  bookings: Booking[];
  timeline: TimelineEvent[];
  createdAt: string;
}

// ---------------- HỘP THƯ HỢP NHẤT ----------------
export type Channel = "zalo" | "gmail" | "messenger" | "tiktok";
export type ConversationLabel = "new_lead" | "dealing" | "won" | "spam";

export interface MailAttachment {
  id: string; // attachmentId phía Gmail
  filename: string;
  mimeType: string;
  size: number; // bytes
}

export interface Message {
  id: string;
  from: "customer" | "agent" | "bot";
  text: string;
  time: string; // ISO
  auto?: boolean; // do bot tự động gửi
  attachments?: MailAttachment[]; // tệp đính kèm (ảnh, file...)
  html?: string; // nội dung HTML gốc của email (nếu có)
}

export interface Conversation {
  id: string;
  channel: Channel;
  customerName: string;
  customerAvatar: string;
  customerColor: string;
  label: ConversationLabel;
  assigneeId?: string;
  brandId?: string; // liên kết hồ sơ khách hàng
  unread: number;
  lastTime: string; // ISO
  messages: Message[];
  // ---- Mail/tin nhắn THẬT lấy từ kênh (VD Gmail) ----
  real?: boolean; // true nếu đến từ kênh thật, không phải dữ liệu mẫu
  externalId?: string; // ID phía kênh (Gmail message id)
  threadId?: string; // ID hội thoại phía Gmail
  contactEmail?: string; // địa chỉ email người gửi (để trả lời)
  subject?: string; // tiêu đề mail
  bodyLoaded?: boolean; // đã tải nội dung đầy đủ chưa
  replied?: boolean; // đã trả lời mail này chưa
}

// ---------------- KỊCH BẢN AUTO-REPLY ----------------
export type RuleTrigger = "keyword" | "intent";
export type ReplyMode = "suggest" | "auto"; // gợi ý (chờ duyệt) hoặc tự gửi

export interface AutoRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: RuleTrigger;
  keywords?: string[]; // khi trigger = keyword
  intent?: string; // khi trigger = intent (VD: hỏi giá, hỏi lịch trống)
  channels: Channel[];
  reply: string;
  mode: ReplyMode;
  isTree?: boolean; // kịch bản nhiều bước (cây hội thoại)
  hits: number; // số lần đã kích hoạt
}

// ---------------- KOL / NHÀ SÁNG TẠO (mình quản lý) ----------------
export type SocialPlatform = "tiktok" | "instagram" | "youtube" | "facebook";

export interface SocialLink {
  platform: SocialPlatform;
  handle: string;
  url: string;
}

export interface RateItem {
  service: string; // VD: Video TikTok, Livestream 2h
  price: number; // VND
}

export interface CreatorCampaign {
  brandId: string;
  campaign: string;
  date: string;
  value: number;
  status: "pending" | "signed" | "done";
}

export interface Creator {
  id: string;
  handle: string; // @ngockemm
  displayName: string;
  avatar: string; // ký tự viết tắt
  color: string;
  cover: string; // gradient CSS
  verified: boolean;
  bio: string;
  niche: string[]; // lĩnh vực nội dung
  location: string;
  managerId: string; // nhân viên quản lý
  status: "active" | "paused";
  joinedAt: string;
  socials: SocialLink[];
  email?: string;
  phone?: string;
  // Chỉ số (số mẫu — người dùng cập nhật số thật)
  followers: number;
  likes: number;
  videos: number;
  avgViews: number;
  engagement: number; // %
  growth: number[]; // tăng trưởng follower gần đây (sparkline)
  // Nhân khẩu học khán giả
  genderFemale: number; // %
  topAge: string;
  topLocations: { name: string; percent: number }[];
  rateCard: RateItem[];
  campaigns: CreatorCampaign[];
}

// ---------------- BÁO CÁO ----------------
export interface DailyStat {
  date: string; // "T2", "T3"...
  messages: number;
  autoReplied: number;
  deals: number;
}
