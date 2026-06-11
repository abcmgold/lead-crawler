# Frontend

React 19 + TypeScript, build bằng Vite, UI dựng trên Radix UI + Tailwind CSS v4 (theme tối/glass-morphism).

## 1. Cấu trúc thư mục

```
frontend/src/
├── main.tsx                 # Entry point: BrowserRouter + AuthProvider + App
├── App.tsx                  # Layout chính, header, navigation, routing, state toàn cục (leads, smtpSettings, toast...)
├── contexts/
│   └── AuthContext.tsx      # Quản lý phiên đăng nhập (user, loading, login, logout)
├── lib/
│   ├── api.ts                # apiFetch() — wrapper fetch, phát sự kiện auth:unauthorized khi 401
│   └── utils.ts              # cn() — gộp className (clsx + tailwind-merge)
└── components/
    ├── LoginPage.tsx          # Trang đăng nhập
    ├── CrawlerTab.tsx          # Tab "Tìm kiếm & Cào"
    ├── LeadsTab.tsx            # Tab "Danh sách Leads"
    ├── CampaignTab.tsx         # Tab "Gửi Email Hàng Loạt"
    ├── SettingsTab.tsx         # Tab "Cài đặt" (cấu hình SMTP + đổi mật khẩu)
    ├── ConfirmDialog.tsx       # Modal xác nhận dùng chung toàn app
    ├── types.ts                # Interfaces: Lead, SmtpSettings, HistoryItem
    └── ui/                     # Component UI dùng chung (style shadcn/Radix)
        ├── button.tsx
        ├── input.tsx
        ├── textarea.tsx
        ├── table.tsx
        ├── card.tsx
        ├── pagination.tsx
        └── alert-dialog.tsx
```

## 2. Khởi tạo & Routing

`main.tsx`:
```tsx
<BrowserRouter>
  <AuthProvider>
    <App />
  </AuthProvider>
</BrowserRouter>
```

`App.tsx` định nghĩa toàn bộ route trong `<Routes>`:

| Path | Component | Ghi chú |
|---|---|---|
| `/login` | `LoginPage` | Render riêng, không có layout chính |
| `/` | → redirect `/crawler` | |
| `/crawler` | `CrawlerTab` | Tìm kiếm & cào dữ liệu |
| `/leads` | `LeadsTab` | Danh sách leads |
| `/email` | `CampaignTab` | Gửi email hàng loạt |
| `/settings` | `SettingsTab` | Cài đặt: cấu hình SMTP + đổi mật khẩu |
| `*` | → redirect `/crawler` | |

### Bảo vệ route

```tsx
const { user, loading: authLoading, logout } = useAuth();

if (location.pathname === '/login') return <LoginPage />;
if (authLoading) return <Spinner />;
if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
```

→ Mọi route trong layout chính (4 tab) yêu cầu đã đăng nhập; nếu chưa, redirect `/login` và lưu lại `location` để quay về sau khi đăng nhập thành công.

## 3. AuthContext (`contexts/AuthContext.tsx`)

- State: `user`, `loading`.
- Khi mount: gọi `GET /api/auth/me` (qua `apiFetch`) để khôi phục phiên (cookie `token` httpOnly tự gửi kèm).
- `login(username, password)`: gọi `POST /api/auth/login`, set `user` nếu thành công.
- `logout()`: gọi `POST /api/auth/logout`, clear `user`.
- Lắng nghe sự kiện window `auth:unauthorized` (do `apiFetch` phát khi gặp HTTP 401 ở bất kỳ API nào) → tự động clear `user`, đẩy người dùng về `/login`.

## 4. `lib/api.ts` — `apiFetch`

```ts
export async function apiFetch(input, init) {
  const res = await fetch(input, init);
  if (res.status === 401) {
    window.dispatchEvent(new Event('auth:unauthorized'));
  }
  return res;
}
```

Mọi gọi API trong app dùng `apiFetch` thay cho `fetch` trực tiếp để đảm bảo xử lý phiên hết hạn nhất quán.

## 5. Layout chính (`App.tsx`)

- **Header (glass panel)**: logo "LeadCrawler", thanh điều hướng 4 tab (`menuItems`), badge trạng thái SMTP (`SMTP: OK` / `CHƯA CẤU HÌNH` dựa trên `smtpSettings.host`), nút đăng xuất (chỉ icon `LogOut`, có `title` tooltip hiển thị username).
- **Stats bar (4 thẻ)**: Tổng số lead cào, Đang chọn gửi, Đã gửi thành công, Gửi thất bại — tính từ `leads` và `selectedIds`.
- **State toàn cục** chia sẻ giữa các tab:
  - `leads: Lead[]` — load qua `loadLeads()` (`GET /api/leads`).
  - `smtpSettings: SmtpSettings` — load qua `loadSettings()` (`GET /api/settings`).
  - `selectedIds: Set<string>` — các lead đang được chọn để gửi email.
  - `toast` — thông báo nổi (4 giây).
  - `showLogoutConfirm`, `showClearLeadsConfirm` — điều khiển modal xác nhận.
- `useEffect` chỉ load dữ liệu **sau khi `user` đã xác định** (tránh gọi API khi chưa đăng nhập).
- Hai `<ConfirmDialog>` dùng chung:
  - Xác nhận đăng xuất → `onConfirm={logout}`.
  - Xác nhận xóa toàn bộ leads → `onConfirm={handleClearAllLeads}` (`variant="destructive"`).

## 6. Components chính

### `LoginPage.tsx`
- Form đăng nhập (username/password), style theo theme glass-panel.
- Gọi `login()` từ `AuthContext`. Lỗi hiển thị inline.
- Đăng nhập thành công → redirect tới `location.state.from` (nếu có) hoặc `/crawler`.

### `CrawlerTab.tsx` — Tìm kiếm & Cào
- Ô nhập từ khóa/URL + nút "Bắt đầu quét & cào" → `POST /api/crawl`.
- Khu vực log tiến trình (console-style) hiển thị quá trình cào.
- Bảng lịch sử quét (`GET /api/history`): thời gian, từ khóa, số website đã quét, số lead mới.
- Nút "Xóa lịch sử" → `DELETE /api/history`, có `ConfirmDialog` xác nhận trước khi xóa.
- Sau khi crawl xong gọi `onCrawlSuccess` (= `loadLeads` ở `App.tsx`) để refresh danh sách leads.

### `LeadsTab.tsx` — Danh sách Leads
- Bảng hiển thị `leads`: Tên, Email, SĐT, Website, Trạng thái gửi email.
- Ô tìm kiếm/lọc theo tên, email, SĐT, website (lọc client-side).
- Checkbox chọn từng dòng / chọn tất cả → cập nhật `selectedIds` (dùng ở `CampaignTab`).
- Phân trang: 10 / 25 / 50 / 100 dòng/trang (`components/ui/pagination.tsx`).
- Nút "Xuất CSV": xuất file CSV có BOM UTF-8 (hiển thị đúng tiếng Việt trong Excel).
- Nút "Xóa tất cả": mở `ConfirmDialog` (qua `onClearAll` truyền từ `App.tsx`) → nếu xác nhận, gọi `DELETE /api/leads`.

### `CampaignTab.tsx` — Gửi Email Hàng Loạt
- **Panel trái**: form soạn email
  - Tiêu đề, nội dung (textarea, hỗ trợ HTML/xuống dòng).
  - Placeholder cá nhân hóa: `{{Name}}`, `{{Email}}`, `{{Phone}}`, `{{Website}}`.
  - Đính kèm file (encode base64 trước khi gửi).
  - Ô nhập email thủ công (`customEmails`, phân tách bằng dấu phẩy/xuống dòng) — dùng cho người nhận ngoài danh sách leads.
  - Hiển thị danh sách lead đã chọn (`selectedLeads`, có thể bỏ chọn từng lead qua `onRemoveLead`).
  - Validate: cần `smtpSettings.host` & `smtpSettings.user` đã có (tức `.env` đã cấu hình) trước khi cho gửi.
- **Panel phải**: log chiến dịch realtime
  - Progress bar 0–100%.
  - Console log có timestamp, màu theo trạng thái (thành công/thất bại/info).
- Gửi: `POST /api/send-emails` với `{ leadIds, customEmails, subject, body, attachments }`. Sau khi xong gọi `refreshLeads` (= `loadLeads`) để cập nhật `emailStatus` mới nhất.

### `SettingsTab.tsx` — Cài đặt (Cấu hình SMTP + Đổi mật khẩu)
- Nhận `smtpSettings`, `onSettingsUpdated`, `showToast` từ `App.tsx`.
- Dùng `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` (Radix, `components/ui/tabs.tsx`) để chia thành 2 tab con: **Cấu hình SMTP** và **Đổi mật khẩu**.
- **Tab Cấu hình SMTP**: input có thể chỉnh sửa (Host, Port, Username, Mật khẩu, Tên người gửi, Email người gửi, checkbox SSL/TLS). Nút **Lưu cấu hình** gọi `POST /api/settings`; kết quả trả về (đã che `pass`) được đẩy ngược lên `App.tsx` qua `onSettingsUpdated` để cập nhật badge SMTP trên header.
- **Tab Đổi mật khẩu**: 3 ô (mật khẩu hiện tại, mật khẩu mới, xác nhận), validate độ dài tối thiểu 6 ký tự và khớp xác nhận trước khi gọi `POST /api/auth/change-password`.
- Cả hai tab dùng `showToast` để báo thành công/lỗi.

### `ConfirmDialog.tsx` — Modal xác nhận dùng chung
```ts
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
}
```
- Dựng trên `components/ui/alert-dialog.tsx` (Radix `AlertDialog`).
- Dùng ở: đăng xuất, xóa toàn bộ leads (`App.tsx`), xóa lịch sử quét (`CrawlerTab.tsx`).
- Mọi nút trong dialog đều có `cursor-pointer`.

### `components/ui/`
- `button.tsx`: `buttonVariants` (cva) — các biến thể `default` / `destructive` / `outline`...
- `alert-dialog.tsx`: wrapper Radix `AlertDialog.Root/Trigger/Portal/Overlay/Content/Title/Description/Action/Cancel`, style theo theme glass-panel.
- `input.tsx`, `textarea.tsx`, `table.tsx`, `card.tsx`, `pagination.tsx`: các UI primitive style shadcn dùng xuyên suốt các tab.
- `lib/utils.ts` cung cấp `cn()` (clsx + tailwind-merge) để gộp className có điều kiện.

## 7. Theme / Styling

- Tailwind CSS v4, theme tối custom qua `@theme` (màu định nghĩa bằng `oklch`).
- Hiệu ứng "glass-panel": nền mờ (`backdrop-blur`), viền mỏng `border-white/5..10`, bóng `shadow-xl`, các khối blur màu trang trí (`blur-[80px]`, `blur-[150px]`) tạo chiều sâu.
- Font: `font-sans` cho nội dung, `font-mono` cho dữ liệu kỹ thuật (số liệu, host, ID).
