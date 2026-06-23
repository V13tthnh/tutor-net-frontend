# Hướng Dẫn Chi Tiết Kiểm Thử 22 Lỗ Hổng Bảo Mật (Security Sandbox)

Tài liệu này hướng dẫn từng bước (step-by-step) cách cấu hình và thực hành tấn công demo đối với **22 lỗ hổng bảo mật** trên hệ thống TutorNet.

Hệ thống hỗ trợ 2 chế độ kiểm thử:
1. **Kiểm thử Toàn cục phía Client (Client-Side Interceptor)**: Tác động trực tiếp lên các form, ô nhập liệu và URL của toàn bộ trang người dùng (client) khi bật toggle.
2. **Bảng mô phỏng Chuyên biệt (Admin Test Panels)**: Kiểm thử cô lập từng lỗi bảo mật kèm so sánh mã nguồn lỗi (Vulnerable) và mã nguồn đã sửa (Fixed) tại trang Quản lý bảo mật.

---

## I. HƯỚNG DẪN TEST TOÀN CỤC PHÍA CLIENT (NEW INTERCEPTOR)

Khi bạn bật các cờ bảo mật dưới đây và truy cập các trang client (ví dụ: Trang chủ, Tìm kiếm gia sư `/tutors`, Lớp học `/classes`, Trang cá nhân `/account/*`), hệ thống sẽ hiển thị Banner **"Chế độ Bảo mật Sandbox đang hoạt động"** ở đầu trang. Lúc này, bạn có thể thực hiện kiểm thử:

### 1. HTML Injection (`html_injection`)
* **Cách kích hoạt**: Vào Admin → Bật cờ `html_injection`.
* **Cách test**: 
  1. Truy cập trang tìm kiếm gia sư hoặc trang cá nhân của client.
  2. Tại bất kỳ ô nhập liệu (input) nào, nhập đoạn mã HTML sau:
     ```html
     <h1 style="color:red; font-size:32px; font-weight:bold; text-align:center;">HỆ THỐNG BỊ TẤN CÔNG HTML INJECTION!</h1><marquee scrollamount="10" style="color:blue; font-size:20px;">Trang web đã bị thay đổi giao diện...</marquee>
     ```
  3. Nhấn **Enter** hoặc click nút Tìm kiếm/Gửi form.
* **Kết quả**: Hệ thống sẽ chặn biểu mẫu, bật hộp thoại cảnh báo **"HTML Injection Vulnerability Triggered!"** và biên dịch, chạy trực tiếp đoạn mã HTML đó trên giao diện demo.

### 2. Reflected XSS (`reflected_xss`)
* **Cách kích hoạt**: Vào Admin → Bật cờ `reflected_xss`.
* **Cách test (Qua Input)**:
  1. Nhập payload sau vào ô tìm kiếm gia sư hoặc ô input bất kỳ:
     ```html
     <script>alert('Reflected XSS - Website hacked!')</script>
     ```
  2. Nhấn **Enter**.
* **Cách test (Qua URL)**:
  1. Truy cập trực tiếp đường dẫn sau trên trình duyệt:
     `http://localhost:3000/tutors?search=%3Cscript%3Ealert(%27Reflected%20XSS%27)%3C/script%3E`
* **Kết quả**: Trình duyệt lập tức hiển thị hộp thoại pop-up `alert` chạy script và hiện bảng thông tin chi tiết về lỗi Reflected XSS cùng mã nguồn khắc phục.

### 3. Stored XSS (`stored_xss`)
* **Cách kích hoạt**: Vào Admin → Bật cờ `stored_xss`.
* **Cách test**:
  1. Nhập payload sau vào một ô input bất kỳ và nhấn **Enter**:
     ```html
     <script>alert('Stored XSS: Script loaded from LocalStorage (Mock DB)')</script>
     ```
  2. Lúc này, hệ thống sẽ bắt và lưu payload này vào `localStorage` (giả lập việc lưu vào Database).
  3. F5 tải lại trang hoặc click chuyển sang bất kỳ trang nào khác thuộc Client (ví dụ chuyển từ trang gia sư sang trang tài khoản).
* **Kết quả**: Khi trang mới tải lên, script độc hại sẽ tự động kích hoạt và bật lên hộp thoại `alert` tương tự như mã độc được tải từ Database của máy chủ.

### 4. DOM-based XSS (`dom_xss`)
* **Cách kích hoạt**: Vào Admin → Bật cờ `dom_xss`.
* **Cách test**:
  1. Thay đổi hash của URL trực tiếp trên thanh địa chỉ trình duyệt bằng cách thêm đoạn mã sau vào cuối URL:
     `http://localhost:3000/tutors#<img src=x onerror="alert('DOM XSS Triggered via URL Hash!')">`
  2. Nhấn **Enter** để trình duyệt cập nhật hash.
* **Kết quả**: Interceptor lắng nghe sự kiện thay đổi hash, ghi thẳng giá trị này vào thuộc tính `innerHTML` của DOM và kích hoạt thực thi script lỗi `onerror`.

### 5. UNION-based SQL Injection (`union_sqli`)
* **Cách kích hoạt**: Vào Admin → Bật cờ `union_sqli`.
* **Cách test**:
  1. Tại ô tìm kiếm gia sư hoặc lớp học, nhập câu lệnh SQL injection sau:
     ```sql
     ' UNION SELECT username, password_hash FROM users --
     ```
  2. Nhấn **Enter** hoặc click Tìm kiếm.
* **Kết quả**: Bật lên hộp thoại mô phỏng lỗi SQL Injection, hiển thị trực quan bảng dữ liệu nhạy cảm chứa danh sách tài khoản quản trị và mật khẩu băm đã bị rò rỉ từ database.

### 6. Bypass Authentication (`bypass_auth`)
* **Cách kích hoạt**: Vào Admin → Bật cờ `bypass_auth`.
* **Cách test**:
  1. Truy cập trang chủ hoặc thiết lập người dùng với tham số phân quyền giả mạo trên URL:
     `http://localhost:3000/?role=admin`
* **Kết quả**: Hệ thống sẽ phát hiện tham số URL, hiển thị hộp thoại cảnh báo bỏ qua phân quyền xác thực và tự động cấp quyền truy cập admin giả lập.

---

## II. HƯỚNG DẪN KIỂM THỬ TRÊN CÁC PANEL MÔ PHỎNG CHUYÊN BIỆT (ADMIN)

Để kiểm tra trực quan code gây lỗi và cách fix, truy cập **Admin (Shield Icon 🛡️) → Security Sandbox**. Chọn lỗi ở danh sách bên trái, gạt Switch sang **Bật** để kích hoạt Panel test bên phải.

### 1. Nhóm Lỗi Injection (Chèn lệnh/mã)
* **HTML Injection**: Nhập thẻ HTML tùy ý để xem giao diện bị phá vỡ cấu trúc.
* **Reflected XSS**: Nhấp nút **Inject** để xem trình duyệt thực thi trực tiếp mã JavaScript từ request.
* **Stored XSS**: Gửi bình luận giả lập chứa mã script độc để xem script được lưu lại và kích hoạt cho người dùng sau.
* **DOM-based XSS**: Nhấn mô phỏng URL hash ghi vào `innerHTML` làm chạy hàm script.
* **UNION-based SQL Injection**: Nhập payload SQL để xem bảng kết quả truy vấn chứa mật khẩu tài khoản bị lấy ra.
* **OS Command Injection**: Nhập địa chỉ IP cần ping kèm dấu nối lệnh để chạy lệnh OS giả lập (ví dụ: `8.8.8.8 ; ls -la` hoặc `127.0.0.1 & dir`).

### 2. Nhóm Lỗi Authentication (Xác thực tài khoản)
* **Bypass Login**: Nhập username chứa `' OR '1'='1` với mật khẩu trống để xem hệ thống đăng nhập thành công không cần mật khẩu.
* **Weak Password**: Thử đặt mật khẩu mới là `123` để xem hệ thống cho phép đổi mật khẩu mà không bắt buộc độ phức tạp tối thiểu.
* **Brute Force**: Chạy giả lập tấn công Brute Force tự động thử mật khẩu liên tục mà không bị khóa tài khoản hoặc giới hạn thời gian.
* **Credential Stuffing**: Chạy kịch bản tự động thử danh sách tài khoản rò rỉ để dò tìm người dùng đăng ký trên hệ thống.
* **Bypass Auth**: Thử gửi request kèm header giả danh `X-Override-Role: Admin` để truy cập thông tin nhạy cảm.
* **Brute Force Secret Key**: Thử tấn công bẻ khóa JWT Signature bằng cách dùng wordlist dò khóa bí mật yếu như `secret` hoặc `123456`.

### 3. Nhóm Lỗi Session (Quản lý phiên đăng nhập)
* **Session Hijacking**: Xem cookie phiên làm việc được thiết lập thiếu cờ `HttpOnly`, cho phép JavaScript dùng lệnh `document.cookie` để lấy trộm token.
* **Session Fixation**: Nhấn đăng nhập để xem Session ID cũ được giữ nguyên thay vì cấp mới, cho phép kẻ xấu cố định phiên đăng nhập của bạn.

### 4. Nhóm Lỗi CSRF (Giả mạo yêu cầu từ trang khác)
* **GET-based CSRF**: Mô phỏng việc nạn nhân click vào một hình ảnh hoặc link chứa yêu cầu thay đổi tài khoản qua HTTP GET (ví dụ: chuyển tiền hoặc đổi mật khẩu).
* **POST-based CSRF**: Mô phỏng việc nạn nhân truy cập một trang web độc hại chứa form ẩn tự động submit HTTP POST để thay đổi thông tin cá nhân trên TutorNet.

### 5. Nhóm Lỗi File Upload (Tải tệp tin độc hại)
* **Upload Webshell**: Tải lên một file có đuôi `.php` chứa mã độc webshell để xem hệ thống cho phép tải lên và cung cấp link kích hoạt shell.
* **MIME Spoofing**: Tải lên file PHP nguy hiểm có Content-Type giả danh là `image/png` để vượt qua bộ lọc MIME thông thường.
* **Extension Bypass**: Tải lên file dạng `shell.php.png` để đánh lừa các cấu hình lọc đuôi file thô sơ.

### 6. Nhóm Lỗi Access Control (Phân quyền truy cập)
* **Missing Authentication**: Thử truy cập API tài khoản cá nhân khi chưa đăng nhập để lấy thông tin người dùng.
* **BOLA (Broken Object Level Authorization)**: Đăng nhập bằng tài khoản sinh viên A, thay đổi ID hợp đồng trên API để đọc lén nội dung hợp đồng của sinh viên B.
* **Path Traversal**: Nhập đường dẫn tương đối nhạy cảm (như `../../../../etc/passwd` hoặc `..\..\..\windows\win.ini`) để tải các file hệ thống máy chủ về client.
