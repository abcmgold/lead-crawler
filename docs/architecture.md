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
                                                          │  backend/data.json │
                                                          │ (leads, logs,      │
                                                          │  settings={})      │
                                                          └──────────────────┘
                                              SMTP server  ◀── nodemailer (email.service)
                                              Google/DuckDuckGo + websites ◀── axios+cheerio (crawl.service)
```

- Frontend gọi API qua đường dẫn tương đối `/api/...` (cùng origin khi deploy chung, hoặc CORS `credentials: true` khi chạy 2 cổng riêng ở dev).
- Mọi request kèm cookie `token` (JWT) để xác thực — không dùng `Authorization: Bearer`.
- Toàn bộ dữ liệu nghiệp vụ (leads, lịch sử crawl) lưu trong **1 file JSON** (`backend/data.json`), không dùng database.
- Cấu hình nhạy cảm (JWT secret, tài khoản admin, SMTP) nằm trong `backend/.env`, không lưu trong `data.json`.

## 2. Kiến trúc Backend (Controller → Service → Repository)

```
routes/  ──▶  controllers/  ──▶  services/  ──▶  repositories/ (data.json)
                    │                 │
              middlewares/      utils/ (logger, userAgent)
```

- **routes/**: khai báo endpoint, gắn middleware xác thực/phân quyền.
- **controllers/**: nhận `req`/`res`, validate input cơ bản, gọi service, trả response.
- **services/**: chứa business logic (crawl web, gửi email, xác thực, đọc settings từ env...).
- **repositories/**: duy nhất `json.repository.js` — đọc/ghi `data.json`.
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
2. Backend so khớp với `ADMIN_USERNAME` + `bcrypt.compare(password, ADMIN_PASSWORD_HASH)` (từ `.env`).
3. Nếu đúng, backend ký JWT (payload chứa `username`, `role`) và set vào cookie `token`:
   - `httpOnly: true`, `sameSite: 'lax'`, `secure: true` khi `NODE_ENV=production`, `maxAge: 8h` (theo `JWT_EXPIRES_IN`).
4. Mọi route `/api/leads`, `/api/crawl`, `/api/history`, `/api/send-emails` đều đi qua `authenticate` middleware (đọc cookie `token`, verify JWT, gắn `req.user`).
5. Route `/api/settings` còn đi qua `authorize('ADMIN')` — chỉ tài khoản role `ADMIN` mới xem được.
6. `GET /api/auth/me` trả về `req.user` — dùng để frontend khôi phục phiên đăng nhập khi load lại trang.
7. `POST /api/auth/logout` xóa cookie `token`.
8. Khi bất kỳ API nào trả `401`, `apiFetch` phát event `auth:unauthorized` → `AuthContext` xóa `user` → `ProtectedRoute` redirect về `/login` (lưu lại `location` để quay lại sau khi đăng nhập).

## 5. Lưu trữ dữ liệu

- File duy nhất: **`backend/data.json`**, cấu trúc:
  ```json
  {
    "leads": [ ... ],
    "logs": [ ... ],
    "settings": {}
  }
  ```
- `settings` luôn là object rỗng — **không còn dùng** để lưu SMTP nữa (đã chuyển sang `.env`), giữ lại chỉ để tương thích cấu trúc file.
- Truy cập qua `json.repository.js`: `getLeads/saveLeads`, `getLogs/saveLogs`, `getAll/saveAll`. File tự khởi tạo nếu chưa tồn tại, tự phục hồi (`{leads:[], settings:{}, logs:[]}`) nếu JSON lỗi.
- File này nằm trong `.gitignore` — không commit, vì có thể chứa dữ liệu thật (email/SĐT đã cào, lịch sử thao tác).

## 6. Cấu hình nhạy cảm (.env)

Tất cả secrets (JWT secret, tài khoản admin, SMTP) nằm trong `backend/.env` (gitignored). `backend/.env.example` là template không chứa giá trị thật. Chi tiết từng biến: xem [backend.md](./backend.md#xác-thực--biến-môi-trường).
