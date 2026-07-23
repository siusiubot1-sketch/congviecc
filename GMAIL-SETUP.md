# Hướng dẫn kết nối Gmail API

Ứng dụng đã tích hợp sẵn code đọc & gửi mail qua Gmail API. Bạn chỉ cần tạo credential
trên Google Cloud (miễn phí) và điền vào `.env.local`.

## Bước 1 — Tạo project & bật Gmail API
1. Vào https://console.cloud.google.com/ → tạo **Project mới** (VD: "KOL Hub").
2. Menu → **APIs & Services → Library** → tìm **Gmail API** → bấm **Enable**.

## Bước 2 — Cấu hình OAuth Consent Screen
1. **APIs & Services → OAuth consent screen**.
2. Chọn **External** → điền tên app, email hỗ trợ.
3. Ở mục **Scopes**, thêm: `.../auth/gmail.readonly` và `.../auth/gmail.send`.
4. Ở mục **Test users**, thêm chính địa chỉ Gmail của bạn (khi app chưa publish, chỉ test user mới đăng nhập được).

## Bước 3 — Tạo OAuth Client ID
1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Application type: **Web application**.
3. **Authorized redirect URIs** → thêm chính xác:
   ```
   http://localhost:3000/api/gmail/callback
   ```
   (Khi deploy online thêm cả `https://<ten-mien>/api/gmail/callback`)
4. Bấm **Create** → copy **Client ID** và **Client Secret**.

## Bước 4 — Điền vào `.env.local`
```env
GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/gmail/callback
APP_URL=http://localhost:3000
```

## Bước 5 — Kết nối
1. Khởi động lại server: `npm run dev` (hoặc build lại nếu chạy production).
2. Mở **http://localhost:3000/ket-noi** → bấm **Kết nối Gmail** → đăng nhập Google → cấp quyền.
3. Sau khi quay lại, bấm **Tải mail gần đây** để xem mail thật, hoặc **Soạn & gửi thử**.

## Kiến trúc code
| File | Vai trò |
|------|---------|
| `src/lib/gmail.ts` | OAuth client, đọc (`listMessages`), gửi (`sendMessage`) |
| `src/app/api/gmail/connect` | Bắt đầu OAuth → chuyển tới Google |
| `src/app/api/gmail/callback` | Nhận code, đổi token, lưu cookie |
| `src/app/api/gmail/status` | Kiểm tra đã cấu hình / đã kết nối |
| `src/app/api/gmail/messages` | Lấy mail gần đây |
| `src/app/api/gmail/send` | Gửi email |
| `src/app/api/gmail/disconnect` | Ngắt kết nối |
| `src/app/ket-noi` | Giao diện quản lý kết nối |

> **Bảo mật:** Token lưu ở cookie `httpOnly`. Ở bản production nhiều người dùng, nên chuyển
> token vào database (bảng `channel_accounts`) và mã hóa — xem lộ trình trong `KIEN-TRUC.md`.
