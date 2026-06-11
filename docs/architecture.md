# Kiến trúc tổng thể

## 1. Tổng quan

LeadCrawler là ứng dụng **client-server** cổ điển:

```
┌──────────────────┐        HTTP (REST, JSON)        ┌──────────────────────┐
│   Frontend (SPA)  │ ───────────────────────────────▶ │   Backend (Express)  │
│  React + Vite     │ ◀─────────────────────────────── │   Node.js API        │
│  http://localhost:│        cookie httpOnly (JWT)     │  http://localhost:3000│
│  5173 (dev)       │                                   └──────────┬───────────┘
└──────────────────┘                                              │
                                                                    ▼
                                                          ┌──────────────────┐
                                                          │  PostgreSQL        │
                                                          │ (leads, crawl_logs)│
                                                          └──────────────────┘
                                              SMTP server  ◀── nodemailer (email.service)
                                              Google/DuckDuckGo + websites ◀── axios+cheerio (crawl.service)
```

- Frontend gọi API qua đường dẫn tương đối `/api/...` (cùng origin khi deploy chung, hoặc CORS `credentials: true` khi chạy 2 cổng riêng ở dev).
- Mọi request kèm cookie `token` (JWT) để xác thực — không dùng `Authorization: Bearer`.
- Toàn bộ dữ liệu nghiệp vụ và cấu hình (leads, lịch sử crawl, tài khoản admin, cấu hình SMTP) lưu trong **PostgreSQL** (bảng `leads`, `crawl_logs`, `users`, `smtp_settings`), kết nối qua `DATABASE_URL`.
- Chỉ còn `JWT_SECRET`, `JWT_EXPIRES_IN` và `DATABASE_URL` nằm trong `backend/.env` — tài khoản admin và cấu hình SMTP được quản lý qua DB/giao diện.

## 2. Kiến trúc Backend (Controller → Service → Repository)

```
routes/  ──▶  controllers/  ──▶  services/  ──▶  repositories/ (db.repository.js → PostgreSQL)
                    │                 │
              middlewares/      utils/ (logger, userAgent)
```

- **routes/**: khai báo endpoint, gắn middleware xác thực/phân quyền.
- **controllers/**: nhận `req`/`res`, validate input cơ bản, gọi service, trả response.
- **services/**: chứa business logic (crawl web, gửi email, xác thực, đọc settings từ env...).
- **repositories/**: duy nhất `db.repository.js` — đọc/ghi PostgreSQL qua `pg` (`src/db/pool.js`).
- **middlewares/**: `auth.middleware.js` (xác thực JWT từ cookie), `authorize.middleware.js` (kiểm tra role).
- **utils/**: `logger.js` (ghi log hệ thống), `userAgent.js` (random User-Agent khi crawl).

Chi tiết đầy đủ API & data model: xem [backend.md](./backend.md).

## 3. Kiến trúc Frontend

- **SPA React** dùng `react-router-dom`, layout chính + điều hướng nằm trong `App.tsx`.
- **AuthContext** (`contexts/AuthContext.tsx`) quản lý trạng thái đăng nhập toàn cục, gọi `/api/auth/me` khi load app.
- **`lib/api.ts`**: wrapper `apiFetch()` quanh `fetch` — tự động phát sự kiện `auth:unauthorized` khi gặp HTTP 401, để `AuthContext` xử lý đăng xuất + chuyển hướng `/login`.
- **components/**: mỗi tab chính (Crawler, Leads, Campaign, Settings) là 1 component riêng, được render qua `<Routes>`.
- **components/ui/**: các component UI dùng chung theo phong cách shadcn/Radix (Button, Table, Card, Pagination, AlertDialog...).
- **Theme**: Tailwind CSS v4 với theme tối (dark / glass-morphism), cấu hình màu bằng `@theme` (oklch).

Chi tiết đầy đủ routing & components: xem [frontend.md](./frontend.md).

## 4. Luồng xác thực (Authentication)

1. Người dùng nhập username/password tại `/login` → `POST /api/auth/login`.
2. Backend tìm tài khoản trong bảng `users` theo `username`, rồi `bcrypt.compare(password, password_hash)`.
3. Nếu đúng, backend ký JWT (payload chứa `username`, `role`) và set vào cookie `token`:
   - `httpOnly: true`, `sameSite: 'lax'`, `secure: true` khi `NODE_ENV=production`, `maxAge: 8h` (theo `JWT_EXPIRES_IN`).
4. Mọi route `/api/leads`, `/api/crawl`, `/api/history`, `/api/send-emails` đều đi qua `authenticate` middleware (đọc cookie `token`, verify JWT bằng `JWT_SECRET`, gắn `req.user`).
5. Route `/api/settings` còn đi qua `authorize('ADMIN')` — chỉ tài khoản role `ADMIN` mới xem/sửa được.
6. `GET /api/auth/me` trả về `req.user` — dùng để frontend khôi phục phiên đăng nhập khi load lại trang.
7. `POST /api/auth/logout` xóa cookie `token`.
8. `POST /api/auth/change-password` (cần đăng nhập) cho phép đổi mật khẩu — kiểm tra mật khẩu cũ, hash mật khẩu mới (bcrypt) và cập nhật bảng `users`.
9. Khi bất kỳ API nào trả `401`, `apiFetch` phát event `auth:unauthorized` → `AuthContext` xóa `user` → `ProtectedRoute` redirect về `/login` (lưu lại `location` để quay lại sau khi đăng nhập).

## 5. Lưu trữ dữ liệu

- **PostgreSQL**, kết nối qua biến `DATABASE_URL` (`backend/.env`), pool tạo tại `src/db/pool.js`.
- Schema (`src/db/schema.sql`):
  - `leads(id, name, email UNIQUE, phone, website, keyword, created_at, email_status)`
  - `crawl_logs(id, keyword, timestamp, urls_count, new_leads_count)`
  - `users(id, username UNIQUE, password_hash, role)` — tài khoản đăng nhập.
  - `smtp_settings(id, host, port, smtp_user, smtp_pass, secure, sender_name, sender_email)` — bản ghi duy nhất (`id = 1`), cấu hình SMTP gửi email.
- Truy cập qua `db.repository.js`: `getLeads`, `findLeadByEmail`, `insertLead` (dedupe theo `email` qua `ON CONFLICT DO NOTHING`), `updateLeadPhone`, `updateLeadStatus`, `clearLeads`, `getLogs`, `addLog`, `clearLogs`, `findUserByUsername`, `updateUserPassword`, `getSmtpSettings`, `saveSmtpSettings`.
- Cấu hình SMTP và tài khoản admin **lưu trong DB**, không còn đọc từ `.env` — chỉnh sửa qua giao diện (`/settings`) hoặc trực tiếp trong DB.
- Scripts một lần (`backend/scripts/`):
  - `init-db.js`: tạo database (nếu chưa có) + áp dụng `schema.sql`.
  - `migrate-data.js`: import dữ liệu từ `backend/data.json` cũ (nếu còn) vào PostgreSQL, bỏ qua bản ghi trùng (`ON CONFLICT DO NOTHING`).
  - `migrate-auth-settings.js`: import tài khoản admin + cấu hình SMTP cũ từ `.env` (nếu còn `ADMIN_*`/`SMTP_*`) vào bảng `users`/`smtp_settings`, bỏ qua nếu đã tồn tại.
  - `create-admin.js <username> <password> [role]`: tạo/cập nhật tài khoản admin — dùng cho lần setup đầu tiên hoặc khi cần reset mật khẩu trực tiếp trên server.
- Production (Vercel serverless) cần trỏ `DATABASE_URL` tới một Postgres có thể truy cập từ internet (vd Neon, Supabase) — filesystem trên Vercel là read-only nên không thể dùng file JSON.

## 6. Cấu hình nhạy cảm (.env)

`backend/.env` (gitignored) chỉ còn chứa `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `NODE_ENV`. Tài khoản admin và cấu hình SMTP nằm trong PostgreSQL (bảng `users`, `smtp_settings`). `backend/.env.example` là template không chứa giá trị thật. Chi tiết từng biến: xem [backend.md](./backend.md#xác-thực--biến-môi-trường).
