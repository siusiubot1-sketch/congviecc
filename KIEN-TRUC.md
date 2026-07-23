# KOL Hub — Kiến trúc tổng thể & Sơ đồ Database

Ứng dụng quản lý công việc cho KOL/KOC và team quản lý KOL. Tài liệu này mô tả kiến trúc,
sơ đồ database và lộ trình tích hợp. Phần giao diện dashboard đã được dựng (xem mục cuối).

---

## 1. Kiến trúc tổng thể

Thiết kế **module hóa** để dễ dàng thêm kênh mới (Messenger, TikTok...) mà không sửa lõi.

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js + React)                   │
│  Dashboard responsive · Tiếng Việt · Tổng quan / Công việc /     │
│  CRM / Hộp thư hợp nhất / Kịch bản / Báo cáo                     │
└───────────────┬─────────────────────────────────────────────────┘
                │  HTTPS / REST + WebSocket (realtime tin nhắn)
┌───────────────▼─────────────────────────────────────────────────┐
│                  BACKEND API (Next.js Route Handlers / NestJS)   │
│  Auth & phân quyền (RBAC) · REST API · WebSocket gateway         │
├─────────────────────────────────────────────────────────────────┤
│                      LỚP DỊCH VỤ (Services)                       │
│  TaskService · CrmService · InboxService · AutomationEngine      │
│  ReportService                                                   │
├───────────────┬──────────────────┬──────────────────────────────┤
│  CHANNEL LAYER (adapter pattern — mỗi kênh 1 adapter cùng interface)
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │  Zalo    │  │  Gmail   │  │Messenger │  │ TikTok   │  (mở rộng)│
│  │ OA API   │  │ API+OAuth│  │  (sau)   │  │  (sau)   │          │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
├─────────────────────────────────────────────────────────────────┤
│  AUTOMATION ENGINE                                               │
│  Keyword matcher → Intent classifier (AI) → Rule resolver →      │
│  Reply (tự gửi | chờ duyệt)                                      │
├───────────────┬──────────────────┬──────────────────────────────┤
│  PostgreSQL   │  Redis           │  AI Provider (Claude API)     │
│  (dữ liệu)    │  (queue/cache)   │  (phân tích ý định + soạn trả lời)│
└───────────────┴──────────────────┴──────────────────────────────┘
```

### Vì sao module hóa qua "Channel Adapter"?
Mỗi kênh (Zalo, Gmail, Messenger...) triển khai **chung một interface**:

```ts
interface ChannelAdapter {
  channel: Channel;
  receive(payload: unknown): Promise<InboundMessage>; // webhook -> chuẩn hóa
  send(conversationId: string, text: string): Promise<void>;
  verifyWebhook(req: Request): boolean;
}
```

→ Thêm kênh mới = viết 1 adapter mới, phần lõi (inbox, automation, CRM) không đổi.

### Luồng một tin nhắn đến
1. Kênh (VD Zalo OA) gọi **webhook** → adapter chuẩn hóa về `InboundMessage`.
2. `InboxService` lưu tin, gắn/khớp `Conversation` + tự liên kết `Brand` (theo email/SĐT/Zalo ID).
3. `AutomationEngine` chạy các `AutoRule` đang bật:
   - **Keyword match**: so khớp từ khóa.
   - **Intent (AI)**: gọi Claude API phân loại ý định (hỏi giá / hỏi lịch trống / xin báo giá...).
4. Nếu khớp rule:
   - `mode = auto` → gửi ngay qua adapter.
   - `mode = suggest` → tạo bản nháp, hiện lên UI để nhân viên **duyệt rồi gửi**.
5. Đẩy realtime về frontend qua WebSocket.

---

## 2. Công nghệ đề xuất

| Lớp | Công nghệ | Lý do |
|-----|-----------|-------|
| Frontend | **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4** | Hiện đại, SSR, responsive — *đã dựng* |
| Backend | Next.js Route Handlers (hoặc **NestJS** tách riêng khi cần scale) | Chung codebase, dễ khởi động |
| Database | **PostgreSQL** + **Prisma ORM** | Quan hệ chặt, migration an toàn |
| Realtime | WebSocket (Socket.IO) / Pusher | Tin nhắn tức thời |
| Queue/Cache | **Redis** + BullMQ | Xử lý webhook, retry gửi tin, nhắc deadline |
| Xác thực | **NextAuth / Auth.js** + JWT, RBAC | Đăng nhập + phân quyền admin/nhân viên |
| AI | **Claude API** (claude-sonnet-5 / opus) | Phân tích ý định + soạn trả lời |
| Tích hợp | Gmail API (OAuth2), Zalo OA API | Đọc/gửi mail & tin nhắn |
| Lưu file | S3 / Cloudflare R2 | File đính kèm hồ sơ khách |

---

## 3. Sơ đồ Database (PostgreSQL)

```
users ──────────────┐
 id (PK)             │ owner_id / assignee_id
 name, email         │
 role (admin|staff)  ▼
 password_hash    brands (nhãn hàng/khách hàng)
                   id (PK)
                   name, industry, stage (lead|dealing|won|lost)
                   owner_id (FK→users)
                   total_value, note
                     │
        ┌────────────┼───────────────┬──────────────┐
        ▼            ▼               ▼              ▼
    contacts     bookings        attachments   timeline_events
    id (PK)      id (PK)         id (PK)        id (PK)
    brand_id FK  brand_id FK     brand_id FK    brand_id FK
    name, role   campaign        file_url       type (note|message|
    phone,email  date, value     name, size          booking|task|call)
                 status                         content, date, author_id

    tasks (công việc)
     id (PK)
     title, description
     status (todo|doing|review|done)
     priority (low|medium|high|urgent)
     due_date, campaign
     assignee_id (FK→users)
     brand_id (FK→brands, nullable)

    conversations (hội thoại)            messages
     id (PK)                              id (PK)
     channel (zalo|gmail|messenger|...)   conversation_id (FK)
     external_id  ← ID phía kênh          direction (in|out)
     customer_name, customer_ref          from (customer|agent|bot)
     label (new_lead|dealing|won|spam)    text, created_at
     assignee_id (FK→users)               is_auto (bot gửi?)
     brand_id (FK→brands, nullable)       ai_intent (nullable)
     unread_count, last_message_at

    auto_rules (kịch bản)                channel_accounts (kết nối kênh)
     id (PK)                              id (PK)
     name, enabled                        channel
     trigger (keyword|intent)             access_token / refresh_token
     keywords (jsonb[]) | intent          oa_id / gmail_address
     channels (jsonb[])                   webhook_secret, status
     reply_template                       expires_at
     mode (suggest|auto)
     is_tree, tree_config (jsonb)         message_stats (báo cáo, cộng dồn/ngày)
     hit_count                            date, messages, auto_replied,
                                          deals_closed, avg_response_sec
```

### Quan hệ chính
- `users 1—N tasks` (assignee), `users 1—N brands` (owner), `users 1—N conversations` (assignee)
- `brands 1—N { contacts, bookings, attachments, timeline_events }`
- `brands 1—N conversations` (một khách có thể nhắn qua nhiều kênh) và `1—N tasks`
- `conversations 1—N messages`
- `auto_rules N—N channels` (lưu mảng jsonb)
- `channel_accounts` giữ token OAuth/OA cho từng kết nối kênh

> Ánh xạ TypeScript của các bảng này nằm ở [src/lib/types.ts](src/lib/types.ts).

---

## 4. Phân quyền (RBAC)

| Hành động | Admin | Nhân viên |
|-----------|:-----:|:---------:|
| Xem toàn bộ khách hàng / báo cáo team | ✅ | ❌ (chỉ của mình) |
| Tạo/sửa/xóa kịch bản auto-reply | ✅ | ❌ |
| Kết nối kênh (Zalo/Gmail OAuth) | ✅ | ❌ |
| Quản lý người dùng & phân quyền | ✅ | ❌ |
| Xử lý hội thoại được gán, tạo/cập nhật task | ✅ | ✅ |

---

## 5. Lộ trình tích hợp thật (sau bản dashboard)

**Giai đoạn 1 — Nền tảng:** Prisma schema + migrate PostgreSQL, Auth.js + RBAC, thay mock data bằng API thật.
**Giai đoạn 2 — Gmail:** OAuth2 (scope `gmail.readonly` + `gmail.send`), Gmail API + Pub/Sub push để nhận mail realtime, chuẩn hóa vào `conversations/messages`.
**Giai đoạn 3 — Zalo OA:** Đăng ký Zalo Official Account, cấu hình webhook nhận tin, gọi API gửi tin, map `external_id`.
**Giai đoạn 4 — Automation Engine:** Keyword matcher + gọi Claude API phân loại ý định, resolver chọn rule, chế độ tự gửi/chờ duyệt, cây hội thoại nhiều bước.
**Giai đoạn 5 — Realtime & nhắc việc:** WebSocket cho inbox, BullMQ cron nhắc deadline.
**Giai đoạn 6 — Kênh mới:** thêm `MessengerAdapter`, `TiktokAdapter` theo interface `ChannelAdapter`.

---

## 6. Giao diện dashboard (đã dựng)

| Trang | Đường dẫn | Nội dung |
|-------|-----------|----------|
| Tổng quan | `/` | KPI, biểu đồ tin nhắn, việc sắp đến hạn, deal theo nhãn hàng, inbox gần đây |
| Công việc | `/cong-viec` | **Kanban kéo-thả** (chờ làm/đang làm/chờ duyệt/hoàn thành) + **dạng Lịch** |
| Lịch | `/lich` | Lịch tháng + danh sách nhắc deadline |
| Khách hàng | `/khach-hang` · `/khach-hang/[id]` | Danh sách nhãn hàng + hồ sơ chi tiết (liên hệ, booking, **timeline tương tác**, file) |
| Hộp thư hợp nhất | `/hop-thu` | Gộp Zalo + Gmail, gắn nhãn, gán nhân viên, liên kết CRM, **gợi ý trả lời AI (duyệt rồi gửi)** |
| Kịch bản auto-reply | `/kich-ban` | Trình tạo rule **không cần code**: theo từ khóa / ý định AI, chọn kênh, chế độ gợi ý/tự gửi, cây hội thoại |
| Báo cáo | `/bao-cao` | Tin nhắn/ngày, tỉ lệ auto-reply, tốc độ phản hồi, deal theo nhãn hàng & nhân viên |

### Chạy dự án
```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build production
```

> Hiện dùng **dữ liệu mẫu** trong [src/lib/mock-data.ts](src/lib/mock-data.ts). Bước tiếp theo là nối backend + database theo lộ trình mục 5.
