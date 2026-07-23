import type {
  User,
  Task,
  Brand,
  Conversation,
  AutoRule,
  DailyStat,
  Creator,
} from "./types";

// ============================================================
// DỮ LIỆU MẪU (SEED) - dùng để khởi tạo store lần đầu.
// Sau đó dữ liệu được quản lý qua DataProvider (localStorage),
// hỗ trợ thêm / sửa / xóa cho tất cả các model.
// ============================================================

export const currentUser: User = {
  id: "u1",
  name: "Tuyên Bé",
  email: "tuyenbedeptrai@gmail.com",
  role: "admin",
  avatar: "TB",
  color: "#7c3aed",
};

// Chỉ một người dùng duy nhất (chủ tài khoản)
export const users: User[] = [currentUser];

export function userById(id?: string): User | undefined {
  return users.find((u) => u.id === id);
}

// Bảng màu gán cho nhãn hàng / KOL mới thêm
export const BRAND_COLORS = [
  "#db2777", "#0891b2", "#b45309", "#ea580c", "#0369a1",
  "#7c3aed", "#059669", "#c2410c", "#4f46e5", "#be123c",
];

export const seedBrands: Brand[] = [
  {
    id: "b1",
    name: "Hasaki Beauty",
    industry: "Mỹ phẩm & Làm đẹp",
    logo: "HB",
    color: "#db2777",
    stage: "won",
    ownerId: "u1",
    totalValue: 320_000_000,
    note: "Khách VIP, ưu tiên xử lý trong 2h. Đã ký hợp đồng năm.",
    contacts: [
      { name: "Chị Lan", role: "Marketing Manager", phone: "0901 234 567", email: "lan@hasaki.vn" },
      { name: "Anh Đức", role: "Booking KOL", phone: "0912 000 111" },
    ],
    attachments: [
      { name: "Hop-dong-2026.pdf", size: "1.2 MB" },
      { name: "Bang-bao-gia.xlsx", size: "340 KB" },
    ],
    bookings: [
      { id: "bk1", campaign: "Review Serum Vitamin C", date: "2026-07-15", value: 45_000_000, status: "done" },
      { id: "bk2", campaign: "TikTok Hè rực rỡ", date: "2026-08-01", value: 80_000_000, status: "signed" },
      { id: "bk3", campaign: "Livestream 8/8", date: "2026-08-08", value: 120_000_000, status: "pending" },
    ],
    timeline: [
      { id: "t1", type: "booking", content: "Chốt booking Livestream 8/8 – 120tr", date: "2026-07-20T09:00:00", authorId: "u1" },
      { id: "t2", type: "message", content: "Khách gửi brief chiến dịch qua Zalo", date: "2026-07-18T14:20:00" },
      { id: "t3", type: "call", content: "Gọi trao đổi timeline sản xuất video", date: "2026-07-16T10:00:00", authorId: "u1" },
      { id: "t4", type: "note", content: "Khách thích tone content trẻ trung, gần gũi", date: "2026-07-10T08:00:00", authorId: "u1" },
    ],
    createdAt: "2026-01-12",
  },
  {
    id: "b2",
    name: "VinFast",
    industry: "Ô tô - Xe điện",
    logo: "VF",
    color: "#0891b2",
    stage: "dealing",
    ownerId: "u1",
    totalValue: 150_000_000,
    note: "Đang thương lượng gói KOL đánh giá xe VF3.",
    contacts: [{ name: "Anh Hùng", role: "Brand Lead", phone: "0988 777 666", email: "hung@vinfast.vn" }],
    attachments: [{ name: "Brief-VF3.pdf", size: "2.1 MB" }],
    bookings: [
      { id: "bk4", campaign: "Trải nghiệm VF3", date: "2026-08-15", value: 150_000_000, status: "pending" },
    ],
    timeline: [
      { id: "t5", type: "message", content: "Khách hỏi bảng báo giá gói toàn diện", date: "2026-07-21T16:30:00" },
      { id: "t6", type: "note", content: "Cần gửi proposal trước 25/07", date: "2026-07-19T11:00:00", authorId: "u1" },
    ],
    createdAt: "2026-06-02",
  },
  {
    id: "b3",
    name: "Highlands Coffee",
    industry: "F&B",
    logo: "HC",
    color: "#b45309",
    stage: "dealing",
    ownerId: "u1",
    totalValue: 60_000_000,
    note: "Chiến dịch ra mắt món mới mùa thu.",
    contacts: [{ name: "Chị Mai", role: "Trade Marketing", email: "mai@highlands.vn" }],
    attachments: [],
    bookings: [
      { id: "bk5", campaign: "Món mới mùa thu", date: "2026-09-01", value: 60_000_000, status: "pending" },
    ],
    timeline: [
      { id: "t7", type: "message", content: "Khách hỏi lịch trống tháng 9", date: "2026-07-22T08:15:00" },
    ],
    createdAt: "2026-07-05",
  },
  {
    id: "b4",
    name: "Shopee",
    industry: "Thương mại điện tử",
    logo: "SP",
    color: "#ea580c",
    stage: "lead",
    ownerId: "u1",
    totalValue: 0,
    note: "Lead mới từ Gmail, chưa liên hệ lại.",
    contacts: [{ name: "Phòng Affiliate", role: "Partnership", email: "affiliate@shopee.vn" }],
    attachments: [],
    bookings: [],
    timeline: [
      { id: "t8", type: "message", content: "Nhận email mời hợp tác chiến dịch 9/9", date: "2026-07-21T09:00:00" },
    ],
    createdAt: "2026-07-21",
  },
  {
    id: "b5",
    name: "La Roche-Posay",
    industry: "Dược mỹ phẩm",
    logo: "LR",
    color: "#0369a1",
    stage: "won",
    ownerId: "u1",
    totalValue: 95_000_000,
    note: "Đã hoàn thành 2 chiến dịch, quan hệ tốt.",
    contacts: [{ name: "Ms. Trang", role: "PR Manager", phone: "0977 555 333" }],
    attachments: [{ name: "Ket-qua-chien-dich.pdf", size: "890 KB" }],
    bookings: [
      { id: "bk6", campaign: "Skincare routine", date: "2026-06-20", value: 55_000_000, status: "done" },
      { id: "bk7", campaign: "Review kem chống nắng", date: "2026-07-10", value: 40_000_000, status: "done" },
    ],
    timeline: [
      { id: "t9", type: "booking", content: "Hoàn thành chiến dịch review kem chống nắng", date: "2026-07-12T10:00:00", authorId: "u1" },
    ],
    createdAt: "2026-03-15",
  },
  {
    id: "b6",
    name: "The Coffee House",
    industry: "F&B",
    logo: "CH",
    color: "#c2410c",
    stage: "lost",
    ownerId: "u1",
    totalValue: 0,
    note: "Ngân sách không phù hợp, tạm dừng.",
    contacts: [{ name: "Anh Nam", role: "Marketing" }],
    attachments: [],
    bookings: [],
    timeline: [
      { id: "t10", type: "note", content: "Khách phản hồi budget không đủ, hẹn Q4", date: "2026-07-08T15:00:00", authorId: "u1" },
    ],
    createdAt: "2026-05-20",
  },
];

export const seedTasks: Task[] = [
  { id: "task1", title: "Quay video review Serum Vitamin C", status: "doing", priority: "high", dueDate: "2026-07-24", assigneeId: "u1", brandId: "b1", campaign: "Review Serum Vitamin C", createdAt: "2026-07-18", description: "Quay + dựng video 60s cho TikTok" },
  { id: "task2", title: "Gửi proposal gói KOL cho VinFast", status: "todo", priority: "urgent", dueDate: "2026-07-25", assigneeId: "u1", brandId: "b2", campaign: "Trải nghiệm VF3", createdAt: "2026-07-19" },
  { id: "task3", title: "Duyệt kịch bản livestream 8/8", status: "review", priority: "high", dueDate: "2026-07-23", assigneeId: "u1", brandId: "b1", campaign: "Livestream 8/8", createdAt: "2026-07-20" },
  { id: "task4", title: "Lên lịch trống tháng 9 cho Highlands", status: "todo", priority: "medium", dueDate: "2026-07-28", assigneeId: "u1", brandId: "b3", campaign: "Món mới mùa thu", createdAt: "2026-07-22" },
  { id: "task5", title: "Chỉnh sửa video theo feedback Hasaki", status: "doing", priority: "medium", dueDate: "2026-07-26", assigneeId: "u1", brandId: "b1", createdAt: "2026-07-21" },
  { id: "task6", title: "Trả lời email hợp tác Shopee 9/9", status: "todo", priority: "high", dueDate: "2026-07-23", assigneeId: "u1", brandId: "b4", createdAt: "2026-07-21" },
  { id: "task7", title: "Báo cáo kết quả chiến dịch La Roche", status: "done", priority: "low", dueDate: "2026-07-13", assigneeId: "u1", brandId: "b5", campaign: "Review kem chống nắng", createdAt: "2026-07-11" },
  { id: "task8", title: "Chụp ảnh sản phẩm mùa thu Highlands", status: "todo", priority: "low", dueDate: "2026-08-05", assigneeId: "u1", brandId: "b3", createdAt: "2026-07-22" },
  { id: "task9", title: "Ký hợp đồng livestream 8/8", status: "review", priority: "urgent", dueDate: "2026-07-24", assigneeId: "u1", brandId: "b1", campaign: "Livestream 8/8", createdAt: "2026-07-20" },
  { id: "task10", title: "Setup trường quay livestream", status: "doing", priority: "high", dueDate: "2026-07-30", assigneeId: "u1", brandId: "b1", campaign: "Livestream 8/8", createdAt: "2026-07-21" },
  { id: "task11", title: "Viết caption 5 bài Instagram", status: "done", priority: "medium", dueDate: "2026-07-15", assigneeId: "u1", brandId: "b5", createdAt: "2026-07-10" },
  { id: "task12", title: "Họp kickoff chiến dịch VF3", status: "todo", priority: "medium", dueDate: "2026-07-27", assigneeId: "u1", brandId: "b2", campaign: "Trải nghiệm VF3", createdAt: "2026-07-22" },
];

export const seedConversations: Conversation[] = [
  {
    id: "c1", channel: "zalo", customerName: "Chị Lan - Hasaki", customerAvatar: "L", customerColor: "#db2777",
    label: "won", assigneeId: "u1", brandId: "b1", unread: 2, lastTime: "2026-07-22T09:40:00",
    messages: [
      { id: "m1", from: "customer", text: "Em ơi bên chị muốn book thêm livestream ngày 8/8 nhé", time: "2026-07-22T09:30:00" },
      { id: "m2", from: "agent", text: "Dạ vâng chị, em sẽ gửi bảng báo giá gói livestream ngay ạ", time: "2026-07-22T09:35:00" },
      { id: "m3", from: "customer", text: "Ok em, chị chờ nha. Giá tốt tí nhé 😄", time: "2026-07-22T09:40:00" },
    ],
  },
  {
    id: "c2", channel: "gmail", customerName: "Phòng Affiliate Shopee", customerAvatar: "S", customerColor: "#ea580c",
    label: "new_lead", brandId: "b4", unread: 1, lastTime: "2026-07-22T08:50:00",
    messages: [
      { id: "m4", from: "customer", text: "Chào bạn, Shopee muốn mời KOL tham gia chiến dịch 9/9. Cho mình xin bảng báo giá nhé.", time: "2026-07-22T08:50:00" },
    ],
  },
  {
    id: "c3", channel: "zalo", customerName: "Chị Mai - Highlands", customerAvatar: "M", customerColor: "#b45309",
    label: "dealing", assigneeId: "u1", brandId: "b3", unread: 0, lastTime: "2026-07-22T08:15:00",
    messages: [
      { id: "m5", from: "customer", text: "Bên em còn lịch trống tháng 9 không?", time: "2026-07-22T08:10:00" },
      { id: "m6", from: "bot", text: "Dạ hiện KOL còn trống các ngày 3, 5, 12, 18/9 ạ. Anh/chị muốn đặt ngày nào để em giữ chỗ ạ?", time: "2026-07-22T08:11:00", auto: true },
      { id: "m7", from: "customer", text: "Cho chị ngày 5/9 nhé", time: "2026-07-22T08:15:00" },
    ],
  },
  {
    id: "c4", channel: "gmail", customerName: "Anh Hùng - VinFast", customerAvatar: "H", customerColor: "#0891b2",
    label: "dealing", assigneeId: "u1", brandId: "b2", unread: 0, lastTime: "2026-07-21T16:30:00",
    messages: [
      { id: "m8", from: "customer", text: "Bên mình gửi giúp proposal gói toàn diện cho chiến dịch VF3 nhé.", time: "2026-07-21T16:30:00" },
    ],
  },
  {
    id: "c5", channel: "zalo", customerName: "Số lạ 0888xxx", customerAvatar: "?", customerColor: "#71717a",
    label: "spam", unread: 0, lastTime: "2026-07-21T14:00:00",
    messages: [
      { id: "m9", from: "customer", text: "VAY VỐN NHANH LÃI SUẤT 0% LIÊN HỆ NGAY", time: "2026-07-21T14:00:00" },
    ],
  },
  {
    id: "c6", channel: "zalo", customerName: "Ms. Trang - La Roche", customerAvatar: "T", customerColor: "#0369a1",
    label: "won", assigneeId: "u1", brandId: "b5", unread: 0, lastTime: "2026-07-20T11:20:00",
    messages: [
      { id: "m10", from: "customer", text: "Cảm ơn em, chiến dịch vừa rồi kết quả rất tốt!", time: "2026-07-20T11:00:00" },
      { id: "m11", from: "agent", text: "Dạ em cảm ơn chị nhiều ạ, mong tiếp tục hợp tác với chị 🥰", time: "2026-07-20T11:20:00" },
    ],
  },
];

export const seedAutoRules: AutoRule[] = [
  {
    id: "r1", name: "Hỏi bảng báo giá", enabled: true, trigger: "intent", intent: "Xin bảng báo giá",
    channels: ["zalo", "gmail"], mode: "suggest", hits: 128,
    reply: "Dạ em gửi anh/chị bảng báo giá mới nhất ạ. Anh/chị tham khảo giúp em, có gì em tư vấn thêm nhé! 📄",
  },
  {
    id: "r2", name: "Hỏi lịch trống", enabled: true, trigger: "intent", intent: "Hỏi lịch trống",
    channels: ["zalo"], mode: "auto", isTree: true, hits: 96,
    reply: "Dạ hiện KOL còn trống các ngày {{lich_trong}} ạ. Anh/chị muốn đặt ngày nào để em giữ chỗ ạ?",
  },
  {
    id: "r3", name: "Chào khách mới", enabled: true, trigger: "keyword", keywords: ["xin chào", "hello", "hi", "alo"],
    channels: ["zalo", "gmail"], mode: "auto", hits: 340,
    reply: "Xin chào anh/chị! 👋 Em là trợ lý của KOL Hub. Anh/chị cần hỗ trợ về booking, báo giá hay lịch trống ạ?",
  },
  {
    id: "r4", name: "Hỏi giá", enabled: true, trigger: "keyword", keywords: ["giá", "bao nhiêu", "chi phí", "quote"],
    channels: ["zalo", "gmail"], mode: "suggest", hits: 210,
    reply: "Dạ chi phí sẽ tùy theo gói và hình thức (video/livestream/bài viết) ạ. Anh/chị cho em xin thông tin chiến dịch để em báo giá chính xác nhé!",
  },
  {
    id: "r5", name: "Lọc spam vay vốn", enabled: true, trigger: "keyword", keywords: ["vay vốn", "lãi suất", "cho vay", "trúng thưởng"],
    channels: ["zalo"], mode: "auto", hits: 54,
    reply: "(Tự động gắn nhãn Spam và không phản hồi)",
  },
  {
    id: "r6", name: "Cảm ơn sau chiến dịch", enabled: false, trigger: "intent", intent: "Cảm ơn / phản hồi tích cực",
    channels: ["zalo", "gmail"], mode: "suggest", hits: 41,
    reply: "Dạ em cảm ơn anh/chị nhiều ạ! Rất mong được tiếp tục đồng hành cùng anh/chị trong các chiến dịch sắp tới 🥰",
  },
];

export const seedCreators: Creator[] = [
  {
    id: "k1",
    handle: "@ngockemm",
    displayName: "Ngọc Kem",
    avatar: "NK",
    color: "#e11d48",
    cover: "linear-gradient(120deg, #f43f5e 0%, #a855f7 55%, #6366f1 100%)",
    verified: true,
    bio: "Nhà sáng tạo nội dung TikTok · Làm đẹp & Lifestyle 💄✨ | Booking: KOL Hub",
    niche: ["Làm đẹp", "Lifestyle", "Review sản phẩm"],
    location: "TP. Hồ Chí Minh",
    managerId: "u1",
    status: "active",
    joinedAt: "2026-02-01",
    socials: [{ platform: "tiktok", handle: "@ngockemm", url: "https://www.tiktok.com/@ngockemm" }],
    email: "booking.ngockem@kolhub.vn",
    phone: "0900 000 000",
    followers: 250_000,
    likes: 3_800_000,
    videos: 210,
    avgViews: 85_000,
    engagement: 7.4,
    growth: [180, 195, 205, 218, 226, 240, 250],
    genderFemale: 82,
    topAge: "18–24",
    topLocations: [
      { name: "TP. Hồ Chí Minh", percent: 41 },
      { name: "Hà Nội", percent: 23 },
      { name: "Đà Nẵng", percent: 11 },
    ],
    rateCard: [
      { service: "Video TikTok (30–60s)", price: 15_000_000 },
      { service: "Combo 3 video", price: 40_000_000 },
      { service: "Livestream 2 giờ", price: 30_000_000 },
      { service: "Booking cả chiến dịch", price: 80_000_000 },
    ],
    campaigns: [
      { brandId: "b1", campaign: "Review Serum Vitamin C", date: "2026-07-15", value: 45_000_000, status: "done" },
      { brandId: "b1", campaign: "TikTok Hè rực rỡ", date: "2026-08-01", value: 80_000_000, status: "signed" },
      { brandId: "b5", campaign: "Review kem chống nắng", date: "2026-07-10", value: 40_000_000, status: "done" },
    ],
  },
];

export const dailyStats: DailyStat[] = [
  { date: "T2", messages: 142, autoReplied: 98, deals: 3 },
  { date: "T3", messages: 168, autoReplied: 121, deals: 2 },
  { date: "T4", messages: 135, autoReplied: 90, deals: 4 },
  { date: "T5", messages: 201, autoReplied: 150, deals: 5 },
  { date: "T6", messages: 224, autoReplied: 178, deals: 6 },
  { date: "T7", messages: 156, autoReplied: 110, deals: 2 },
  { date: "CN", messages: 88, autoReplied: 70, deals: 1 },
];

// ---- Alias tương thích với code đọc trực tiếp (dashboard tĩnh) ----
export const brands = seedBrands;
export const tasks = seedTasks;
export const conversations = seedConversations;
export const autoRules = seedAutoRules;
export const creators = seedCreators;

export function brandById(id?: string): Brand | undefined {
  return seedBrands.find((b) => b.id === id);
}
export function creatorById(id?: string): Creator | undefined {
  return seedCreators.find((c) => c.id === id);
}

export const dealsByBrand = seedBrands
  .filter((b) => b.totalValue > 0)
  .map((b) => ({ name: b.name, value: b.totalValue, color: b.color }))
  .sort((a, b) => b.value - a.value);
