# Tính năng theo màn hình

## 1. Đăng nhập (`/login`)

- Đăng nhập bằng tài khoản admin duy nhất (username/password).
- Phiên đăng nhập lưu qua cookie JWT httpOnly, hết hạn sau 8 giờ (mặc định).
- Tự động chuyển về trang trước đó (nếu có) sau khi đăng nhập thành công.
- Truy cập bất kỳ trang nào khi chưa đăng nhập (hoặc phiên hết hạn) → tự động chuyển về `/login`.
- Đăng xuất: nút icon (góc phải header) → hiện modal xác nhận → xóa cookie phiên.

## 2. Tìm kiếm & Cào dữ liệu (`/crawler`)

- Nhập **từ khóa** (vd "công ty phần mềm Hà Nội") hoặc **URL/domain/email** trực tiếp.
- Hệ thống:
  1. Tìm kiếm trên Google, nếu thất bại tự động chuyển sang DuckDuckGo.
  2. Lọc bỏ các trang mạng xã hội/không liên quan (Google, YouTube, Facebook, Twitter, Instagram).
  3. Cào tối đa ~40 website kết quả.
  4. Với mỗi website: trích xuất tên, email, số điện thoại; tự động dò và cào thêm trang "Liên hệ"/"Giới thiệu" nếu có.
  5. Loại trùng theo email — chỉ thêm lead mới nếu email chưa tồn tại.
- Hiển thị log tiến trình thời gian thực trong lúc cào.
- **Lịch sử quét**: bảng liệt kê các lần crawl trước (thời gian, từ khóa, số website đã quét, số lead mới tìm được).
- Xóa toàn bộ lịch sử quét (có modal xác nhận).

## 3. Danh sách Leads (`/leads`)

- Bảng dữ liệu: Tên, Email, Số điện thoại, Website, Trạng thái gửi email.
- **Tìm kiếm/lọc** theo tên, email, số điện thoại hoặc website.
- **Phân trang**: 10 / 25 / 50 / 100 dòng mỗi trang.
- **Chọn lead**: chọn từng dòng hoặc chọn tất cả → dùng để gửi email hàng loạt ở tab kế tiếp.
- **Xuất CSV**: tải file CSV (UTF-8 BOM, hiển thị đúng tiếng Việt khi mở bằng Excel).
- **Xóa toàn bộ leads**: có modal xác nhận trước khi xóa vĩnh viễn.
- Thanh thống kê đầu trang (dùng chung toàn app): tổng số lead, số đang chọn, số đã gửi thành công, số gửi thất bại.

## 4. Gửi Email Hàng Loạt (`/email`)

- **Soạn email**:
  - Tiêu đề & nội dung (hỗ trợ xuống dòng → tự chuyển HTML).
  - **Cá nhân hóa** bằng placeholder: `{{Name}}`, `{{Email}}`, `{{Phone}}`, `{{Website}}` — thay bằng dữ liệu thực của từng lead khi gửi.
  - **Đính kèm file**.
  - Có thể thêm **email thủ công** ngoài danh sách lead đã chọn (nhập, phân tách bằng dấu phẩy hoặc xuống dòng).
  - Xem & bỏ chọn từng lead trong danh sách đã chọn trước khi gửi.
- **Theo dõi tiến trình gửi**:
  - Thanh tiến độ (%) theo số email đã xử lý.
  - Log chi tiết theo thời gian thực, có màu phân biệt thành công/thất bại/thông tin.
- Sau khi gửi: cập nhật trạng thái từng lead (`Gửi thành công` / `Thất bại: <lý do>`), đồng bộ lại với danh sách leads.
- Để tránh bị nhà cung cấp email chặn vì spam: hệ thống **tự động delay 2 giây** giữa mỗi email gửi đi.
- Yêu cầu SMTP đã được cấu hình (bảng `smtp_settings` trong DB) trước khi cho phép gửi.

## 5. Cài đặt (`/settings`)

### Cấu hình SMTP
- Form chỉnh sửa cấu hình SMTP dùng để gửi email:
  - SMTP Host, Port
  - Email/Username đăng nhập
  - Mật khẩu/SMTP Key (hiển thị dạng che `********`; để trống hoặc giữ nguyên `********` khi lưu sẽ không đổi mật khẩu cũ)
  - Tên người gửi hiển thị, Email người gửi
  - Checkbox SSL/TLS
- Nút **Lưu cấu hình** gọi `POST /api/settings`, lưu trực tiếp vào PostgreSQL (bảng `smtp_settings`) và áp dụng ngay cho lần gửi email tiếp theo.
- Badge trạng thái SMTP trên header (`SMTP: OK` / `CHƯA CẤU HÌNH`) phản ánh `smtpSettings.host` có giá trị hay không.

### Đổi mật khẩu đăng nhập
- Form nhập mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu mới.
- Gọi `POST /api/auth/change-password`, kiểm tra mật khẩu hiện tại trước khi cập nhật hash mới vào bảng `users`.

## 6. Thành phần dùng chung

- **Toast thông báo**: hiển thị 4 giây cho các thao tác thành công/lỗi (load dữ liệu, crawl, gửi email, xuất CSV...).
- **Modal xác nhận (ConfirmDialog)**: dùng cho mọi hành động phá hủy dữ liệu (đăng xuất, xóa toàn bộ leads, xóa lịch sử quét) — thay thế hoàn toàn cho `window.confirm`/`alert`.
- **Giao diện responsive**: menu điều hướng dạng pill trên desktop, thanh cuộn ngang trên mobile.
