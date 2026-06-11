# LeadCrawler

Ứng dụng web giúp **tìm kiếm/cào dữ liệu liên hệ (email, số điện thoại) từ Internet** theo từ khóa hoặc website, lưu trữ thành danh sách Leads, và **gửi email hàng loạt (email marketing)** tới các Leads đó.

Dự án gồm 2 phần:

- **`backend/`** — REST API viết bằng Node.js/Express, xử lý crawl dữ liệu, quản lý leads, gửi email, xác thực người dùng.
- **`frontend/`** — Giao diện web viết bằng React + TypeScript + Vite + Tailwind CSS.

> Tài liệu chi tiết về kiến trúc, API và tính năng nằm trong thư mục [`docs/`](./docs):
> - [docs/architecture.md](./docs/architecture.md) — Kiến trúc tổng thể, luồng xác thực, lưu trữ dữ liệu
> - [docs/backend.md](./docs/backend.md) — Chi tiết Backend (API, services, data model)
> - [docs/frontend.md](./docs/frontend.md) — Chi tiết Frontend (routing, components)
> - [docs/features.md](./docs/features.md) — Danh sách tính năng theo từng màn hình
> - [docs/checklist.md](./docs/checklist.md) — Checklist triển khai & vận hành

---

## 1. Tính năng chính

- 🔎 **Crawl Leads**: Nhập từ khóa hoặc URL, hệ thống tự tìm kiếm (Google → DuckDuckGo dự phòng), cào website, tự phát hiện trang "Liên hệ/Giới thiệu" và trích xuất email + số điện thoại.
- 📋 **Quản lý Leads**: Bảng danh sách leads, tìm kiếm/lọc, phân trang, chọn nhiều, xuất CSV (hỗ trợ tiếng Việt), xóa toàn bộ.
- 📧 **Gửi Email hàng loạt**: Soạn email với placeholder cá nhân hóa (`{{Name}}`, `{{Email}}`, `{{Phone}}`, `{{Website}}`), đính kèm file, theo dõi log gửi realtime, cập nhật trạng thái từng lead.
- ⚙️ **Cấu hình SMTP (chỉ xem)**: SMTP được cấu hình qua biến môi trường `.env` trên server, giao diện chỉ hiển thị (không cho sửa/lưu qua web).
- 🔐 **Đăng nhập**: Một tài khoản admin duy nhất, xác thực bằng JWT lưu trong cookie httpOnly.
- 🕘 **Lịch sử quét**: Theo dõi các lượt crawl trước đó (từ khóa, số website, số leads mới).

Xem chi tiết tại [docs/features.md](./docs/features.md).

---

## 2. Công nghệ sử dụng

### Backend
- Node.js + Express 5
- Xác thực: JWT (`jsonwebtoken`) + `bcryptjs`
- Crawl dữ liệu: `axios` + `cheerio`
- Gửi email: `nodemailer`
- Cấu hình: `dotenv`
- Lưu trữ: file JSON (`backend/data.json`)

### Frontend
- React 19 + TypeScript + Vite
- Định tuyến: `react-router-dom`
- UI: Radix UI + Tailwind CSS v4 (theme dark/glass-morphism)
- Icon: `lucide-react`
- `class-variance-authority` + `tailwind-merge` cho biến thể component

---

## 3. Cấu trúc thư mục

```
mvp/
├── backend/            # Express API
│   ├── src/
│   │   ├── controllers/   # Xử lý request
│   │   ├── services/      # Business logic (crawl, email, auth, settings, lead)
│   │   ├── repositories/  # Lưu trữ dữ liệu (json.repository.js -> data.json)
│   │   ├── routes/        # Định nghĩa endpoint
│   │   ├── middlewares/    # auth.middleware, authorize.middleware
│   │   └── utils/          # logger, userAgent
│   ├── server.js          # Điểm khởi chạy
│   ├── data.json          # CSDL dạng JSON (không commit)
│   ├── .env / .env.example
│   └── clean_phones.js    # Script dọn dữ liệu số điện thoại
│
├── frontend/           # React app
│   └── src/
│       ├── components/    # CrawlerTab, LeadsTab, CampaignTab, SettingsTab, LoginPage, ConfirmDialog, ui/...
│       ├── contexts/       # AuthContext
│       ├── lib/            # api.ts (fetch wrapper)
│       ├── App.tsx         # Routing & layout chính
│       └── main.tsx
│
├── design-system/      # Tài nguyên thiết kế
├── docs/                # Tài liệu dự án
└── .gitignore
```

---

## 4. Cài đặt & chạy dự án

### Yêu cầu
- Node.js >= 18

### Backend

```bash
cd backend
npm install
copy .env.example .env   # Windows (hoặc cp trên macOS/Linux)
# Điền các biến môi trường trong .env (xem docs/backend.md)
node server.js
```

API mặc định chạy tại `http://localhost:3000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Giao diện chạy tại `http://localhost:5173` (Vite dev server, proxy/CORS tới backend).

Build production:

```bash
npm run build
```

---

## 5. Biến môi trường (backend/.env)

| Biến | Mô tả |
|---|---|
| `PORT` | Cổng chạy API (mặc định `3000`) |
| `JWT_SECRET` | Khóa bí mật ký JWT |
| `JWT_EXPIRES_IN` | Thời hạn token (vd `8h`) |
| `ADMIN_USERNAME` | Tên đăng nhập admin |
| `ADMIN_PASSWORD_HASH` | Hash bcrypt của mật khẩu admin |
| `ADMIN_ROLE` | Vai trò (mặc định `ADMIN`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE` | Cấu hình máy chủ SMTP gửi email |
| `SMTP_SENDER_NAME`, `SMTP_SENDER_EMAIL` | Tên & email người gửi hiển thị |

Chi tiết và cách tạo `ADMIN_PASSWORD_HASH`: xem [docs/backend.md](./docs/backend.md#xác-thực--biến-môi-trường).

---

## 6. Lưu ý bảo mật

- File `.env`, `data.json`, `system.log`, `.claude/`, `.agent/` đã được thêm vào `.gitignore` — **không commit**.
- SMTP credentials chỉ tồn tại trên server (`.env`), API `/api/settings` luôn che (mask) mật khẩu khi trả về client.
- Không có cách nào sửa cấu hình SMTP qua giao diện — phải sửa trực tiếp `.env` trên server rồi khởi động lại backend.
