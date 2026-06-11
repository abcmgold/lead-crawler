# Backend

Express.js API, CommonJS, entry point: `backend/server.js`.

## 1. Cấu trúc thư mục

```
backend/
├── server.js                      # Tạo app Express, mount middleware & route gốc /api
├── scripts/
│   ├── init-db.js                  # Tạo database (nếu chưa có) + áp dụng schema.sql
│   ├── migrate-data.js             # Import data.json cũ (nếu còn) vào PostgreSQL
│   ├── migrate-auth-settings.js    # Import ADMIN_*/SMTP_* cũ từ .env vào bảng users/smtp_settings
│   └── create-admin.js             # Tạo/cập nhật tài khoản admin (node create-admin.js <user> <pass> [role])
├── .env / .env.example
└── src/
    ├── routes/
    │   ├── index.js                # Mount tất cả route con vào /api, gắn middleware auth/authorize
    │   ├── auth.routes.js
    │   ├── leads.routes.js
    │   ├── crawl.routes.js
    │   ├── history.routes.js
    │   ├── email.routes.js
    │   └── settings.routes.js
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── leads.controller.js
    │   ├── crawl.controller.js
    │   ├── history.controller.js
    │   ├── email.controller.js
    │   └── settings.controller.js
    ├── services/
    │   ├── auth.service.js         # Sinh/verify JWT, kiểm tra tài khoản admin (bảng users), đổi mật khẩu
    │   ├── lead.service.js         # CRUD leads, dọn số điện thoại
    │   ├── crawl.service.js        # Tìm kiếm + cào website
    │   ├── email.service.js        # Gửi email hàng loạt qua SMTP
    │   └── settings.service.js     # Đọc/ghi cấu hình SMTP (bảng smtp_settings)
    ├── repositories/
    │   └── db.repository.js        # Đọc/ghi PostgreSQL (leads, crawl_logs, users, smtp_settings)
    ├── db/
    │   ├── pool.js                  # pg connection pool (DATABASE_URL)
    │   └── schema.sql                # DDL bảng leads, crawl_logs, users, smtp_settings
    ├── middlewares/
    │   ├── auth.middleware.js      # Xác thực JWT từ cookie
    │   └── authorize.middleware.js # Kiểm tra role
    └── utils/
        ├── logger.js                # Ghi log hệ thống (system.log)
        └── userAgent.js             # Random User-Agent khi crawl
```

## 2. Khởi tạo ứng dụng (`server.js`)

```js
require('dotenv').config();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', apiRoutes);
app.listen(PORT);
```

Tất cả endpoint nằm dưới tiền tố **`/api`**.

## 3. Danh sách API Endpoints

`src/routes/index.js` mount các route và áp middleware:

```js
router.use('/auth', authRoutes);                                   // public
router.use('/leads', authenticate, leadsRoutes);                   // cần đăng nhập
router.use('/crawl', authenticate, crawlRoutes);                   // cần đăng nhập
router.use('/history', authenticate, historyRoutes);               // cần đăng nhập
router.use('/send-emails', authenticate, emailRoutes);             // cần đăng nhập
router.use('/settings', authenticate, authorize('ADMIN'), settingsRoutes); // cần role ADMIN
```

### Auth — `/api/auth`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/auth/login` | Không | Đăng nhập bằng `{ username, password }`. Trả `{ user }`, set cookie `token` (JWT, httpOnly, 8h). |
| POST | `/api/auth/logout` | Không | Xóa cookie `token`. |
| GET | `/api/auth/me` | ✅ | Trả `{ user }` của session hiện tại (dùng để khôi phục đăng nhập khi load trang). |
| POST | `/api/auth/change-password` | ✅ | Body `{ oldPassword, newPassword }`. Đổi mật khẩu tài khoản hiện tại (yêu cầu mật khẩu mới ≥ 6 ký tự). |

### Leads — `/api/leads`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/leads` | ✅ | Lấy toàn bộ danh sách leads. |
| DELETE | `/api/leads` | ✅ | Xóa toàn bộ leads. |
| POST | `/api/leads/clean-phones` | ✅ | Chuẩn hóa số điện thoại của tất cả leads (regex Việt Nam, tối đa 2 số/lead, loại trùng). |

### Crawl — `/api/crawl`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/crawl` | ✅ | Body `{ keyword }` (từ khóa hoặc URL/domain/email). Tìm kiếm + cào website, trả về kết quả từng URL và số lead mới được thêm vào bảng `leads`. Đồng thời ghi 1 bản ghi vào `crawl_logs` (lịch sử crawl). |

### History — `/api/history`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/history` | ✅ | Lấy danh sách lịch sử crawl (`HistoryItem[]`). |
| DELETE | `/api/history` | ✅ | Xóa toàn bộ lịch sử crawl. |

### Email — `/api/send-emails`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/send-emails` | ✅ | Body `{ leadIds, customEmails, subject, body, attachments }`. Gửi email hàng loạt qua SMTP cấu hình trong bảng `smtp_settings` (server-side, **không nhận SMTP từ client**). Cập nhật `emailStatus` của từng lead, trả về `{ success, message, successCount, failCount, details }`. |

### Settings — `/api/settings`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/settings` | ✅ + role `ADMIN` | Trả cấu hình SMTP từ bảng `smtp_settings`, `pass` luôn được che thành `'********'` (hoặc `''` nếu chưa cấu hình). |
| POST | `/api/settings` | ✅ + role `ADMIN` | Body `SmtpSettings`. Cập nhật cấu hình SMTP trong DB. Nếu `pass` để trống hoặc gửi `'********'`, mật khẩu cũ được giữ nguyên. Trả về cấu hình đã lưu (đã che `pass`). |

## 4. Data Model (PostgreSQL — bảng `leads` / `crawl_logs`)

### Lead

```ts
{
  id: string;            // ID ngẫu nhiên, ví dụ "_1e6js7dgm"
  name: string;          // Tên website / tiêu đề trang (title hoặc og:site_name)
  email: string;         // Email liên hệ (đã loại trùng)
  phone: string;         // Tối đa 2 số điện thoại, phân tách bởi ", "
  website: string;       // URL nguồn
  keyword: string;       // Từ khóa/URL đã dùng để tìm ra lead này
  createdAt: string;     // ISO timestamp
  emailStatus: string;   // "Chưa gửi" | "Gửi thành công" | "Thất bại: <lý do>"
}
```

### HistoryItem (log crawl)

```ts
{
  id: string;
  keyword: string;       // từ khóa/URL đã quét
  timestamp: string;     // ISO timestamp
  urlsCount: number;     // số website đã quét
  newLeadsCount: number; // số lead mới thêm vào CSDL
}
```

### SmtpSettings (trả về từ `/api/settings`, lưu trong bảng `smtp_settings`)

```ts
{
  host: string;
  port: string;
  user: string;
  pass: string;          // luôn là "********" hoặc "" nếu chưa cấu hình
  senderName?: string;
  senderEmail?: string;
  secure?: boolean;
}
```

## 5. Service: Crawl (`crawl.service.js`)

**Đầu vào**: 1 chuỗi `keyword` — có thể là từ khóa tìm kiếm, một URL/domain, hoặc một địa chỉ email.

**Quy trình**:
1. **Phát hiện loại input**:
   - Là email → lấy domain làm điểm bắt đầu.
   - Là URL/domain → dùng trực tiếp.
   - Là từ khóa → tìm kiếm Google, nếu lỗi/không có kết quả thì fallback sang DuckDuckGo.
2. Lọc bỏ các domain không liên quan: Google, YouTube, Facebook, Twitter, Instagram...
3. Cào tối đa ~40 URL kết quả tìm kiếm. Với mỗi URL:
   - Tải trang với **User-Agent ngẫu nhiên** (`utils/userAgent.js`) để giảm khả năng bị chặn.
   - Lấy tên từ `<title>` hoặc thẻ meta `og:site_name`.
   - Trích xuất **email** bằng regex `/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,8}/g`.
   - Trích xuất **số điện thoại** theo định dạng Việt Nam (10 số bắt đầu bằng `0`, đầu số di động `03/05/07/08/09`, đầu số cố định `02x`; cũng nhận `+84` rồi chuẩn hóa về `0`).
   - **Tự động dò trang Liên hệ/Giới thiệu**: tìm link chứa "liên hệ", "contact", "giới thiệu", "about", cào thêm trang đó và gộp kết quả.
   - Trạng thái mỗi URL: `success` (có contact), `no_contacts`, hoặc `failed`.
4. **Loại trùng**: chỉ thêm lead mới nếu email chưa tồn tại trong bảng `leads` (`INSERT ... ON CONFLICT (email) DO NOTHING`). Lead mới giữ tối đa 2 số điện thoại duy nhất.
5. Ghi 1 bản ghi `HistoryItem` vào bảng `crawl_logs`.
6. Mọi hoạt động được ghi log qua `utils/logger.js` (file `system.log`, các mức `INFO/WARNING/ERROR`).

## 6. Service: Email (`email.service.js`)

- Dùng **Nodemailer**, transporter tạo từ cấu hình SMTP lấy từ `settings.service.getSettings()` (đọc bảng `smtp_settings`).
- Hỗ trợ port `587` (STARTTLS) hoặc `465` (SSL, `secure: true`).
- Gộp 2 nguồn người nhận: `leadIds` (lấy email từ bảng `leads`) + `customEmails` (nhập tay).
- Với mỗi email:
  - Thay thế placeholder `{{Name}}`, `{{Email}}`, `{{Phone}}`, `{{Website}}` trong `subject`/`body`.
  - Chuyển nội dung text → HTML (xuống dòng → `<br>`).
  - Đính kèm file (`attachments`, dạng base64).
  - Gửi qua transporter; cập nhật `lead.emailStatus` = `"Gửi thành công"` hoặc `"Thất bại: <lỗi>"`.
  - **Delay 2 giây** giữa các email để tránh bị nhà cung cấp đánh dấu spam.
- Lỗi từng email không làm dừng cả chiến dịch — kết quả tổng hợp trả về `{ successCount, failCount, details }`.
- Sau mỗi email gửi, `email_status` của lead tương ứng được cập nhật ngay trong bảng `leads` (bỏ qua các email nhập tay `custom_*`).

## 7. Service: Settings (`settings.service.js`)

```js
async function getSettings() {
  const settings = await dbRepo.getSmtpSettings();
  return settings || { host: '', port: '', user: '', pass: '', secure: false, senderName: '', senderEmail: '' };
}

async function getPublicSettings() {
  const settings = await getSettings();
  return { ...settings, pass: settings.pass ? '********' : '' };
}

async function saveSettings(data) {
  const current = await getSettings();
  const pass = (!data.pass || data.pass === '********') ? current.pass : data.pass;
  const updated = { host: data.host || '', port: data.port || '', user: data.user || '', pass,
    secure: !!data.secure, senderName: data.senderName || '', senderEmail: data.senderEmail || '' };
  await dbRepo.saveSmtpSettings(updated);
  return updated;
}
```

- `getSettings()` (đầy đủ, dùng nội bộ bởi `email.service`).
- `getPublicSettings()` (che mật khẩu, dùng cho `GET /api/settings`).
- `saveSettings(data)` (dùng cho `POST /api/settings`) — nếu `pass` rỗng hoặc là `'********'`, giữ nguyên mật khẩu cũ trong DB.
- Cấu hình SMTP nằm trong bảng `smtp_settings` (1 dòng, `id = 1`), chỉnh sửa qua giao diện `/settings` hoặc trực tiếp trong DB.

## 8. Xác thực & Biến môi trường

### Tài khoản

Hệ thống chỉ có **1 tài khoản admin**, lưu trong bảng `users` (`username`, `password_hash` bcrypt, `role`).

- Tạo/đổi tài khoản admin từ server: `node scripts/create-admin.js <username> <password> [role]`.
- Đổi mật khẩu từ giao diện: tab **Cài đặt** → "Đổi Mật Khẩu Đăng Nhập" (gọi `POST /api/auth/change-password`).
- Tạo hash mật khẩu thủ công (nếu cần thao tác trực tiếp trong DB):
```bash
node -e "console.log(require('bcryptjs').hashSync('mật-khẩu-của-bạn', 10))"
```

### Bảng biến môi trường (`backend/.env`)

| Biến | Mô tả | Ví dụ |
|---|---|---|
| `PORT` | Cổng chạy API | `3000` |
| `DATABASE_URL` | Connection string PostgreSQL | `postgresql://user:pass@host:5432/leadcrawler?schema=public` |
| `JWT_SECRET` | Khóa ký JWT (chuỗi ngẫu nhiên dài) | `xxxxxxxx...` |
| `JWT_EXPIRES_IN` | Thời hạn token | `8h` |
| `NODE_ENV` | `production` để bật cookie `secure: true` | `production` |

Tài khoản admin và cấu hình SMTP **không còn nằm trong `.env`** — xem mục "Tài khoản" ở trên và tab **Cài đặt** trên giao diện.

`.env` (chứa giá trị thật) **không được commit** — chỉ commit `.env.example` (placeholder).

## 9. Logging & Tiện ích

- `utils/logger.js`: ghi log hệ thống (`system.log`, gitignored), dùng trong crawl/email service để theo dõi lỗi.
- `utils/userAgent.js`: danh sách User-Agent để xoay vòng khi crawl, giảm khả năng bị chặn.
- Chuẩn hóa số điện thoại cho toàn bộ leads: gọi `POST /api/leads/clean-phones` (chạy `lead.service.cleanPhones()` trên bảng `leads`).
