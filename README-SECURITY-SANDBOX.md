# Hướng Dẫn Sử Dụng và Test Security Sandbox

Hệ thống **Security Sandbox** là một môi trường giả lập (simulation playground) trực quan được tích hợp sẵn trong ứng dụng nhằm mục đích học tập, kiểm thử và biểu diễn các lỗ hổng bảo mật phổ biến thuộc **OWASP Top 10**.

Dưới đây là hướng dẫn chi tiết cách truy cập và thực hiện test trên giao diện.

---

## 1. Cách truy cập Giao diện Security Sandbox
Sau khi khởi động ứng dụng (`bun run dev`), bạn có thể truy cập bằng một trong hai cách:
1. **Truy cập trực tiếp qua URL:** [http://localhost:3000/admin/security-sandbox](http://localhost:3000/admin/security-sandbox)
2. **Qua thanh Menu Admin:** Click vào mục **"Security sandbox"** ở menu bên trái của trang Admin (có icon hình chiếc khiên bảo vệ 🛡️).

---

## 2. Nguyên lý hoạt động khi Bật/Tắt các cờ bảo mật (Security Flags)

### Cơ chế Lưu trữ & Phân quyền
* Khi bạn bật/tắt một cờ bảo mật ở danh sách bên trái, ứng dụng sẽ gọi API `POST /api/security-flags` để cập nhật trạng thái cờ đó.
* Trạng thái này được mã hóa và ký tên (signed) để lưu trữ vào cookie có tên `security_sandbox`.
* Việc lưu trữ dưới dạng Cookie giúp trạng thái bật/tắt của các lỗi bảo mật được **ghi nhớ liên tục** khi bạn tải lại trang hoặc di chuyển qua các menu khác.

### Ảnh hưởng trên Giao diện Client (Test Panels)
Hệ thống hoạt động theo cơ chế **Giả lập Tương tác trực tiếp (Interactive Client-Side Simulator)**:
* **Khi TẮT lỗ hổng (Disabled):** 
  * Panel test bên phải sẽ bị **khóa lại (gray out)**, mờ đi và không cho phép click (`pointer-events-none`).
  * Hệ thống hiển thị thông báo nhắc nhở bạn cần bật lỗi bảo mật này lên để có thể tương tác giả lập.
* **Khi BẬT lỗ hổng (Enabled):**
  * Giao diện panel test bên phải được **kích hoạt hoàn toàn** (sáng lên, cho phép nhập liệu, click nút bấm).
  * Bạn có thể nhập các payload độc hại, chọn các kịch bản tấn công và nhấn nút gửi yêu cầu để xem phản hồi thực tế của mã độc.

---

## 3. Các kịch bản Test mẫu (Ví dụ cụ thể)

### Kịch bản 1: Test lỗi "MIME Spoofing" (File Upload)
1. Chọn lỗ hổng **MIME Spoofing** ở danh sách bên trái và gạt Switch sang **Bật (Enabled)**.
2. Click vào tên lỗ hổng để mở bảng điều khiển bên phải.
3. Chọn preset đầu tiên: `shell.php (Spoofed to image/jpeg)`:
   * Đây là file PHP nguy hại, nhưng header gửi đi đã bị giả mạo thành `Content-Type: image/jpeg`.
4. Click **"Upload shell.php"**:
   * **Vulnerable check (Màu đỏ):** Sẽ hiển thị **Cho phép upload thành công** vì server cũ chỉ tin tưởng hoàn toàn vào header `Content-Type` do client gửi lên.
   * **Fixed check (Màu xanh):** Sẽ hiển thị **Bị chặn thành công** vì hệ thống đã sử dụng Magic Bytes để đọc trực tiếp byte đầu của file nhằm phát hiện file thực tế là PHP.

### Kịch bản 2: Test lỗi "Bypass Auth" (Authentication)
1. **Bật** lỗ hổng **Bypass Auth** và mở panel tương ứng.
2. Bạn sẽ thấy các phương thức bypass khác nhau như:
   * Không bypass (bình thường)
   * Thêm query parameter `?admin=true`
   * Thêm custom header `X-Admin: 1`
3. Chọn `?admin=true` và nhấn **"Gửi request"**:
   * Hệ thống giả lập sẽ hiển thị kết quả **Bypass thành công** (lấy được toàn bộ dữ liệu doanh thu, quản trị nhạy cảm) do server có lỗi logic khi tin tưởng query string mà không xác thực JWT token của admin.

### Kịch bản 3: Test lỗi "UNION-based SQLi" (SQL Injection)
1. **Bật** lỗ hổng **UNION-based SQLi** và mở panel.
2. Nhập payload SQL Injection vào thanh tìm kiếm, ví dụ: `' UNION SELECT username, password FROM users --`
3. Nhấp nút **Tìm kiếm**:
   * **Vulnerable check:** Sẽ xuất hiện bảng dữ liệu chứa danh sách tài khoản kèm mật khẩu (mã hash) bị rò rỉ trực tiếp trên màn hình.
   * **Fixed check:** Hệ thống sử dụng Parameterized Query (PreparedStatement) nên payload được xử lý như một chuỗi tìm kiếm thông thường và không trả về dữ liệu nhạy cảm.

---

## 4. Lợi ích của mô hình Giả lập trong Sandbox
* **An toàn tuyệt đối:** Các hành vi nguy hiểm như chạy lệnh hệ thống (OS Command Injection) hay đọc file nhạy cảm (Path Traversal) được chạy giả lập an toàn trên client của bạn, tránh rủi ro phá hỏng cơ sở dữ liệu hoặc làm treo máy chủ.
* **Trực quan sinh động:** Đi kèm mỗi panel test đều có mã nguồn ví dụ **Vulnerable** (đoạn code gây lỗi) và **Fixed** (đoạn code đã sửa đổi an toàn) để nhà phát triển so sánh và học tập trực tiếp.
