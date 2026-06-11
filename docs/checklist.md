# Checklist Triển Khai & Vận Hành Hệ Thống

Tài liệu này hướng dẫn chi tiết các bước cần thực hiện để chuẩn bị, cấu hình, kiểm thử và đưa hệ thống tìm kiếm leads & gửi email hàng loạt vào hoạt động thực tế.

---

## 🟩 Phase 1: Chuẩn bị & Cấu hình SMTP
- [ ] **Tạo Mật khẩu Ứng dụng (App Password) cho Gmail**
  - *Nếu dùng Gmail gửi thư*: Hãy truy cập tài khoản Google -> Bảo mật -> bật Xác minh 2 bước -> tạo Mật khẩu ứng dụng (chọn loại Khác, đặt tên là "LeadCrawler"). Bạn sẽ nhận được chuỗi 16 ký tự dùng thay cho mật khẩu đăng nhập thông thường.
- [ ] **Lấy thông tin cấu hình của nhà cung cấp SMTP (nếu dùng dịch vụ ngoài)**
  - *Dịch vụ thay thế*: SendGrid, Mailgun hoặc Amazon SES (nếu cần gửi hàng chục ngàn email/ngày). Lấy Hostname, Port và API Key.
- [ ] **Cập nhật thông tin cấu hình vào Tab "Cấu hình SMTP" trên giao diện**
  - Nhập SMTP Host (ví dụ: `smtp.gmail.com`).
  - Nhập Port (`587` cho bảo mật STARTTLS hoặc `465` cho SSL).
  - Điền email đăng nhập và mật khẩu ứng dụng.
  - Điền Tên Người Gửi hiển thị (ví dụ: `Nguyen Van A | Cong ty XYZ`).
  - Bấm **Lưu cấu hình** để áp dụng.

---

## 🟩 Phase 2: Chạy Thử & Kiểm Thử Tính Năng
- [ ] **Kiểm tra tính năng cào dữ liệu (Crawling)**
  - Nhập từ khóa thử nghiệm: `công ty phần mềm hà nội` hoặc `nha khoa uy tín` trên giao diện chính.
  - Bấm **Bắt đầu quét & cào**.
  - Theo dõi cửa sổ log để xem tiến trình tải trang và kết quả trích xuất email/số điện thoại từ các trang web.
  - Sau khi cào xong, truy cập tab **Danh sách Leads** để kiểm tra các thông tin thu thập được có hiển thị đúng cột Tên, Email, Sđt, Website hay không.
- [ ] **Kiểm tra tính năng lọc & xuất CSV**
  - Nhập từ khóa vào ô tìm kiếm nhanh trên bảng Lead để lọc nhanh dữ liệu.
  - Nhấn nút **Xuất CSV** để tải về tệp Excel và kiểm tra lỗi hiển thị font tiếng Việt (Unicode).
- [ ] **Gửi email thử nghiệm (Test Campaign)**
  - Tự cào một lead hoặc thêm thủ công thông tin hòm thư phụ của bạn vào dữ liệu (hoặc chọn 1 lead cụ thể có email của chính bạn để kiểm tra).
  - Soạn nội dung thử nghiệm với tiêu đề và thân bài sử dụng các biến placeholder `{{Name}}`, `{{Website}}`.
  - Nhấn **Gửi** và kiểm tra hộp thư đến (bao gồm cả mục Spam) để xem thư hiển thị định dạng và tên người gửi đã chuẩn chưa.

---

## 🟩 Phase 3: Tối Ưu Hóa & Vận Hành Lâu Dài
- [ ] **Cấu hình thời gian trễ (Cooldown Delay) gửi mail**
  - Để tránh tài khoản email bị khóa do gửi thư rác quá nhanh, nên duy trì thời gian trễ tối thiểu `2000ms - 5000ms` (2 đến 5 giây) giữa mỗi email trong file `server.js` (Hệ thống hiện tại mặc định là `2000ms`).
- [ ] **Cá nhân hóa nội dung mẫu thư**
  - Luôn sử dụng thẻ động `{{Name}}` ở phần chào hỏi để tạo cảm giác thân thiện và giảm tỷ lệ bị Gmail quét spam tự động.
- [ ] **Xoay vòng User-Agent và Proxy (Mở rộng nâng cao)**
  - Nếu cào khối lượng cực lớn (>100 trang cùng lúc) và bị Google chặn tìm kiếm, hãy cân nhắc tích hợp thêm proxy xoay vòng trong backend để đổi IP liên tục.
- [ ] **Sao lưu cơ sở dữ liệu**
  - Tệp dữ liệu leads và cấu hình nằm tại tệp `data.json` trong thư mục gốc của dự án. Hãy sao chép tệp này định kỳ để lưu trữ dự phòng.
