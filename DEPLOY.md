# Đưa ứng dụng lên online (Deploy)

Ứng dụng là Next.js — nền tảng phù hợp nhất là **Vercel** (miễn phí, tự động HTTPS, tối ưu sẵn cho Next.js).

## Cách 1 — Vercel qua GitHub (khuyên dùng)

1. **Đẩy code lên GitHub**
   - Tạo repo mới (private) tại https://github.com/new
   - Trong thư mục dự án chạy:
     ```bash
     git remote add origin https://github.com/<tai-khoan>/quanlikol.git
     git branch -M main
     git push -u origin main
     ```
     (Dự án đã được `git init` + commit sẵn.)

2. **Import vào Vercel**
   - Vào https://vercel.com → **Add New → Project** → chọn repo vừa đẩy.
   - Framework: Vercel tự nhận **Next.js**. Bấm **Deploy**.

3. **Khai báo biến môi trường** (Vercel → Project → Settings → Environment Variables):
   | Tên | Giá trị |
   |-----|---------|
   | `GOOGLE_CLIENT_ID` | *(client id của bạn)* |
   | `GOOGLE_CLIENT_SECRET` | *(client secret)* |
   | `GOOGLE_REDIRECT_URI` | `https://<ten-mien>.vercel.app/api/gmail/callback` |
   | `APP_URL` | `https://<ten-mien>.vercel.app` |

   Sau khi thêm biến → **Redeploy** để áp dụng.

4. **Cập nhật Google Cloud**
   - Vào OAuth Client → **Authorized redirect URIs** → thêm:
     `https://<ten-mien>.vercel.app/api/gmail/callback`

Xong! Mở `https://<ten-mien>.vercel.app` là dùng được online.

## Cách 2 — Vercel CLI (nếu quen dòng lệnh)
```bash
npm i -g vercel
vercel        # đăng nhập + deploy bản preview
vercel --prod # deploy production
```
Rồi thêm env vars như bảng trên bằng `vercel env add`.

## Lưu ý quan trọng
- **Token Gmail** hiện lưu ở cookie `httpOnly` — hoạt động tốt trên Vercel (serverless). Với nhiều người dùng, hãy chuyển sang lưu token trong database (xem `KIEN-TRUC.md`).
- Mỗi khi đổi tên miền, phải cập nhật lại `GOOGLE_REDIRECT_URI` + redirect URI trên Google Cloud, nếu không OAuth sẽ báo lỗi `redirect_uri_mismatch`.
- File `.env.local` **không** được đẩy lên git (đã nằm trong `.gitignore`) — credential chỉ khai báo trong dashboard Vercel.

## Tôi (Claude) không thể tự deploy thay bạn vì:
Deploy cần đăng nhập tài khoản Vercel/GitHub của bạn (thao tác xác thực trên trình duyệt). Tôi đã chuẩn bị toàn bộ code, git commit và hướng dẫn — bạn chỉ cần đăng nhập và bấm Deploy. Nếu muốn, tôi có thể hướng dẫn từng bước theo thời gian thực.
