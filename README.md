# KOL Hub

Ứng dụng web quản lý công việc cho KOL/KOC và team quản lý KOL: dashboard tập trung
quản lý công việc, khách hàng/nhãn hàng, KOL, và hộp thư hợp nhất (Gmail, Zalo) với
auto-reply theo kịch bản.

## Công nghệ
- **Next.js 16** (App Router) + React 19 + TypeScript + Tailwind CSS v4
- **PostgreSQL + Prisma** (database)
- **Gmail API** (OAuth2) — đọc & gửi mail thật
- Xem file Word/Excel/PDF/ảnh ngay trong app (mammoth, xlsx)

## Chạy dự án
```bash
npm install

# 1) Tạo file .env (database) — xem .env.example
#    DATABASE_URL="postgresql://postgres:MAT_KHAU@localhost:5432/kolhub?schema=public"
# 2) Tạo file .env.local (Gmail) — xem .env.example
# 3) Tạo bảng trong database:
npx prisma db push

# 4) Chạy
npm run dev        # http://localhost:3000
# hoặc
npm run build && npm run start
```

## Tài liệu
- [KIEN-TRUC.md](KIEN-TRUC.md) — kiến trúc & sơ đồ database
- [GMAIL-SETUP.md](GMAIL-SETUP.md) — hướng dẫn kết nối Gmail API
- [DEPLOY.md](DEPLOY.md) — đưa app lên online

## Bảo mật
File `.env` và `.env.local` chứa bí mật (mật khẩu DB, khóa Gmail) — **đã được gitignore**,
không bao giờ đẩy lên git. Chỉ `.env.example` (mẫu, không có bí mật) được commit.
