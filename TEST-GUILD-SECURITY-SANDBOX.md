# Hướng Dẫn Chi Tiết Kiểm Thử 22 Lỗ Hổng Bảo Mật (Security Sandbox)

Tài liệu này hướng dẫn từng bước (step-by-step) cách cấu hình và thực hành tấn công demo đối với **22 lỗ hổng bảo mật** trên hệ thống TutorNet.

Hệ thống hỗ trợ 2 chế độ kiểm thử:
1. **Kiểm thử Toàn cục phía Client (Client-Side Interceptor)**: Tác động trực tiếp lên các form, ô nhập liệu và URL của toàn bộ trang người dùng (client) khi bật toggle.
2. **Bảng mô phỏng Chuyên biệt (Admin Test Panels)**: Kiểm thử cô lập từng lỗi bảo mật kèm so sánh mã nguồn lỗi (Vulnerable) và mã nguồn đã sửa (Fixed) tại trang Quản lý bảo mật.

---

## I. HƯỚNG DẪN TEST TOÀN CỤC PHÍA CLIENT (NEW INTERCEPTOR)

Khi bạn bật các cờ bảo mật dưới đây và thực hiện các hành động trên trang client (ví dụ: Trang chủ, Tìm kiếm gia sư `/tutors`, Lớp học `/classes`, Trang cá nhân `/account/*`), bạn có thể thực hiện kiểm thử:

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
     `http://localhost:3000/tutors#<img src=x onerror="alert('DOM XSS')">`
  2. Nhấn **Enter** để trình duyệt cập nhật hash.
* **Kết quả**: Interceptor lắng nghe sự kiện thay đổi hash, ghi thẳng giá trị này vào thuộc tính `innerHTML` của DOM và kích hoạt thực thi script lỗi `onerror`.

### 5. UNION-based SQL Injection (`union_sqli`)
* **Cách kích hoạt**: Vào Admin → Bật cờ `union_sqli`.
* **Cách test**:
  1. Truy cập trang **Tìm kiếm gia sư** (`/tutors`) ở giao diện client.
  2. Tại thanh tìm kiếm, nhập câu lệnh SQL injection sau:
     ```sql
     ' UNION SELECT id, password_hash, email, phone, avatar_url FROM users--
     ```
  3. Nhấn **Enter** hoặc click Tìm kiếm.
* **Kết quả**: 
  - **Khi cờ Bật (Vulnerable):** Danh sách hồ sơ gia sư biến mất hoàn toàn và được thay thế bằng danh sách dữ liệu nhạy cảm thực tế từ bảng `users` (bao gồm mật khẩu băm, email...) hiển thị dạng text thô theo chiều ngang từng dòng trực tiếp trên trang `/tutors`.
  - **Khi cờ Tắt (Bảo mật):** Server sử dụng Prepared Statement (JPA Criteria), câu lệnh SQL độc hại được xử lý an toàn như một chuỗi tìm kiếm thông thường và hệ thống sẽ hiển thị `"Không tìm thấy gia sư..."`.

### 6. Bypass Login (`bypass_login`)
* **Cách kích hoạt**: Vào Admin → Bật cờ `bypass_login`.
* **Cách test**:
  1. Truy cập trang **Đăng nhập** dành cho Client (`/auth/login`).
  2. Tại ô **Email**, nhập đoạn mã độc SQL:
     ```sql
     ' OR '1'='1
     ```
  3. Tại ô **Mật khẩu**, nhập ký tự bất kỳ hoặc để trống và click **Đăng nhập**.
* **Kết quả**: 
  - **Khi cờ Bật (Vulnerable):** Đăng nhập thành công mà không cần mật khẩu và tự động được đăng nhập dưới vai trò tài khoản gia sư **`johnsnow9813@gmail.com`**.
  - **Khi cờ Tắt (Bảo mật):** Request đăng nhập bị từ chối và báo lỗi `"Email hoặc mật khẩu không chính xác"`.

### 7. Brute Force Attack (`brute_force`)
* **Cách kích hoạt**: Vào Admin → Bật cờ `brute_force`.
* **Cách test**:
  1. Truy cập trang **Đăng nhập** Client (`/auth/login`).
  2. **Khi cờ Tắt (Bảo mật):** Nhập sai mật khẩu liên tiếp 5 lần cho một tài khoản bất kỳ. Đến lần thứ 6, hệ thống kích hoạt cơ chế khóa tài khoản, trả về thông báo lỗi `"Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút"`.
  3. **Khi cờ Bật (Vulnerable):** Bạn có thể nhập sai liên tiếp bao nhiêu lần tùy thích (hơn 5 lần) mà tài khoản không bao giờ bị khóa, cho phép attacker brute force mật khẩu thoải mái.

### 8. Mật khẩu Yếu (`weak_password`)
* **Cách kích hoạt**: Vào Admin → Bật cờ `weak_password`.
* **Cách test**:
  1. Truy cập trang **Đăng ký** tài khoản Client (`/auth/register`).
  2. **Khi cờ Tắt (Bảo mật):** Nhập mật khẩu đơn giản (ví dụ: `123` hoặc `abc`) và nhấn đăng ký. Hệ thống sẽ chặn lại và báo lỗi mật khẩu quá yếu (yêu cầu tối thiểu 8 ký tự, có chữ hoa, chữ thường, chữ số và ký tự đặc biệt).
  3. **Khi cờ Bật (Vulnerable):** Cho phép bạn đăng ký thành công với các mật khẩu siêu ngắn như `123`.

### 9. Credential Stuffing (`credential_stuffing`)
* **Cách kích hoạt**: Vào Admin → Bật cờ `credential_stuffing`.
* **Cách test**:
  1. Truy cập trang **Admin → Security Sandbox → Credential Stuffing** ở panel bên phải.
  2. Click **Khôi phục DB** để đưa database về cấu hình gốc.
  3. Nhấn **Chạy Credential Stuffing**.
* **Kết quả**: Frontend gửi request POST kèm danh sách tài khoản rò rỉ lên API `/api/v1/demo/auth/credential-stuffing`. Backend thực hiện đối soát thực tế với cơ sở dữ liệu và trả về kết quả HIT chính xác (Tài khoản `johnsnow9813@gmail.com` khớp mật khẩu rò rỉ `Admin@123` bị hack thành công).

### 10. Bypass Authentication (`bypass_auth`)
* **Cách kích hoạt**: Vào Admin → Bật cờ `bypass_auth`.
* **Cách test**:
  1. Truy cập trang chủ hoặc thiết lập người dùng với tham số phân quyền giả mạo trên URL:
     `http://localhost:3000/?role=admin`
* **Kết quả**: Hệ thống sẽ phát hiện tham số URL, hiển thị hộp thoại cảnh báo bỏ qua phân quyền xác thực và tự động cấp quyền truy cập admin giả lập.

### 11. Session Hijacking (`session_hijacking`) trực tiếp tại `/auth/login`
* **Cách kích hoạt**: Vào Admin → Bật cờ `session_hijacking`.
* **Cách test**:
  1. Truy cập trang đăng nhập thực tế của hệ thống `/auth/login`.
  2. Bạn sẽ thấy một banner màu vàng HUD cảnh báo **"Sandbox: Đang kích hoạt Session Hijacking!"** xuất hiện phía trên nút Đăng nhập.
  3. Tiến hành đăng nhập bằng tài khoản tutor `johnsnow9813@gmail.com` (mật khẩu `Admin@123`).
  4. Sau khi đăng nhập thành công, nhấn F12 mở tab **Console** trên trình duyệt và gõ lệnh:
     ```javascript
     document.cookie
     ```
* **Kết quả**: 
  - **Khi cờ Bật (Vulnerable):** Cookie `client_access_token` được trả về dưới dạng text hiển thị trực tiếp trong Console (do cờ `HttpOnly` bị tắt đi), kẻ tấn công có thể lấy cắp token này dễ dàng bằng JS.
  - **Khi cờ Tắt (Bảo mật):** Cookie `client_access_token` được bảo vệ bằng cờ `HttpOnly`, gõ `document.cookie` sẽ không hiển thị token này.

### 12. Session Fixation (`session_fixation`) trực tiếp tại `/auth/login`
* **Cách kích hoạt**: Vào Admin → Bật cờ `session_fixation`.
* **Cách test**:
  1. Giả lập kẻ tấn công thiết lập mã cookie cố định bằng cách truy cập đường dẫn sau trên trình duyệt (giả lập click link độc hại):
     `http://localhost:3000/auth/login?TUTOR_SESSION=fixed_attacker_123`
  2. Một banner màu vàng HUD cảnh báo **"Sandbox: Đang kích hoạt Session Fixation!"** xuất hiện.
  3. Đăng nhập bằng tài khoản của bạn.
* **Kết quả**: 
  - **Khi cờ Bật (Vulnerable):** Sau khi đăng nhập, kiểm tra cookie (tab Application -> Cookies) vẫn thấy sự hiện diện của cookie `TUTOR_SESSION=fixed_attacker_123`. Lúc này kẻ tấn công có thể dùng chính session ID `fixed_attacker_123` này để truy cập thông tin của bạn thông qua trang thông tin demo: `http://localhost:3000/demo/profile`.
  - **Khi cờ Tắt (Bảo mật):** Trình duyệt không chứa cookie này hoặc cookie cũ bị thu hồi và cấp mới an toàn.

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
* **Session Hijacking**: Sử dụng giao diện Split-Screen (Trình duyệt nạn nhân bên trái và Terminal tấn công bên phải). Nhấp nút kích hoạt mã độc XSS trên trình duyệt nạn nhân để đánh cắp cookie thiếu cờ `HttpOnly`, chuyển thẳng mã session sang Terminal kẻ tấn công để Replay Request. Đặc biệt, bảng **Session Monitor Dashboard** sẽ phát hiện trùng lặp phiên làm việc từ hai địa chỉ IP khác nhau và bật cảnh báo đỏ nhấp nháy: `⚠ Session Hijacking Suspected`.
* **Session Fixation**: Sử dụng giao diện Split-Screen. Attacker tạo trước một Session ID cố định rồi chèn vào đường dẫn. Mô phỏng nạn nhân truy cập qua URL giả lập có chứa session ID cố định đó và tiến hành đăng nhập. Ở chế độ Vulnerable, server không đổi Session ID sau khi xác thực thành công, cho phép kẻ tấn công dùng chính Session ID đã biết trước để truy xuất thông tin của nạn nhân. Chuyển sang Safe để kiểm chứng cơ chế tự động gia hạn Session ID (Regenerated session ID).

### 4. Nhóm Lỗi CSRF (Giả mạo yêu cầu từ trang khác)
* **GET-based CSRF**: Mô phỏng việc nạn nhân click vào một hình ảnh hoặc link chứa yêu cầu thay đổi tài khoản qua HTTP GET (ví dụ: chuyển tiền hoặc đổi mật khẩu).
* **POST-based CSRF**: Mô phỏng việc nạn nhân truy cập một trang web độc hại chứa form ẩn tự động submit HTTP POST để thay đổi thông tin cá nhân trên TutorNet.

### 5. Nhóm Lỗi File Upload (Tải tệp tin độc hại)
* **Upload Webshell**: Tải tệp tin webshell `.php` (hoặc dùng mẫu) gửi tới `/api/v1/demo/upload/vulnerable`. Sau khi upload thành công, sử dụng ô **Command Terminal** bên dưới để chạy thử các lệnh hệ thống thực tế (ví dụ: `id`, `whoami`, `cat .env`, `ls`) truy xuất trực tiếp dữ liệu từ Web Server.
* **MIME Spoofing**: Chọn file webshell `shell.php` giả danh định dạng `image/jpeg` để gửi lên server. So sánh kết quả của endpoint **Vulnerable** (tin tưởng hoàn toàn header của client và cho phép lưu) với endpoint **Safe** (đọc Magic Bytes nội dung file và chặn đứng thành công).
* **Extension Bypass**: Nhập các định dạng tên file chứa nhiều đuôi mở rộng hoặc đuôi viết hoa/viết thường (ví dụ: `shell.php.jpg`, `avatar.jpg.php`, `shell.PHP`). Gửi lên server để kiểm tra thuật toán lọc đuôi file thô sơ (bị vượt qua) so với lọc đuôi file chuẩn hóa.

### 6. Nhóm Lỗi Access Control (Phân quyền truy cập)
* **Missing Authentication**: Thử truy cập API tài khoản cá nhân khi chưa đăng nhập để lấy thông tin người dùng.
* **BOLA (Broken Object Level Authorization)**: Đăng nhập bằng tài khoản sinh viên A, thay đổi ID hợp đồng trên API để đọc lén nội dung hợp đồng của sinh viên B.
* **Path Traversal**: Nhập đường dẫn tương đối nhạy cảm (như `../../../../etc/passwd` hoặc `..\..\..\windows\win.ini`) để tải các file hệ thống máy chủ về client.

---

## III. HƯỚNG DẪN KIỂM THỬ CSRF TỰ NHIÊN (TẬN DỤNG XSS/HTML INJECTION SẴN CÓ)

Để buổi demo cho giảng viên sinh động và tự nhiên nhất (không cần nạp file HTML chuẩn bị trước của hacker), ta lợi dụng lỗi **HTML Injection** đang có sẵn trên thanh tìm kiếm của trang **Lớp học của tôi (`/account/my-classes`)**. 

### 1. Kịch bản GET-based CSRF (Tự động đổi tên tài khoản qua iframe ẩn)
* **Các bước test:**
  1. Đăng nhập vào hệ thống dưới tài khoản tutor `johnsnow9813@gmail.com` (mật khẩu `Admin@123`).
  2. Bật cờ **HTML Injection** trong trang quản lý Sandbox.
  3. Đóng vai kẻ tấn công gửi link tìm kiếm sau đây cho nạn nhân (hoặc tự dán vào thanh địa chỉ trình duyệt):
     `http://localhost:3000/account/my-classes?keyword=%3Ciframe%20src%3D%22%2Fapi%2Fv1%2Fdemo%2Fcsrf%2Fprofile%2Fvulnerable-update-name%3FfullName%3DHacker%2520Bi%2520An%22%20width%3D0%20height%3D0%20style%3D%22display%3Anone%22%3E%3C%2Fiframe%3E`
  4. Trình duyệt nạp trang, render thẻ `<iframe>` ẩn từ tham số `keyword`, tự động gửi request GET mạo danh để cập nhật thông tin họ tên.
  5. **Kết quả:** Ngay lập tức, không cần nhấn F5, họ tên hiển thị trên header góc phải và sidebar tài khoản của nạn nhân sẽ tự động thay đổi thành **"Hacker Bi An"**!

### 2. Kịch bản POST-based CSRF (Mạo danh tạo tin đăng lớp qua ảnh kích hoạt XSS)
* **Các bước test:**
  1. Đảm bảo bạn đang đăng nhập và cờ **HTML Injection** đang bật.
  2. Mở trình duyệt và truy cập đường dẫn sau (giả lập click link dụ dỗ chứa mã độc XSS gọi POST API):
     `http://localhost:3000/account/my-classes?keyword=%3Cimg%20src%3D%22x%22%20onerror%3D%22fetch%28%27%2Fapi%2Fv1%2Fclass-requests%27%2C%20%7Bmethod%3A%27POST%27%2C%20headers%3A%7B%27Content-Type%27%3A%27application%2Fjson%27%7D%2C%20body%3AJSON.stringify%28%7BcontactName%3A%27N%E1%BA%A1n%20Nh%C3%A2n%20CSRF%27%2C%20contactPhone%3A%270987654321%27%2C%20subjectId%3A1%2C%20gradeLevel%3A%27Kh%E1%BB%91i%2012%27%2C%20proposedPrice%3A999999%2C%20sessionsPerWeek%3A3%2C%20durationMinutes%3A90%2C%20teachingMode%3A%27ONLINE%27%2C%20studentNotes%3A%27POST%20CSRF%20th%E1%BB%B1c%20t%E1%BA%BF%20qua%20HTML%20Injection%27%7D%2529%7D%29%22%20%2F%3E`
  3. Trình duyệt render ảnh bị lỗi `x`, kích hoạt thuộc tính `onerror` tự động gọi hàm `fetch` POST gửi yêu cầu đăng lớp giả mạo kèm theo session cookie của nạn nhân.
  4. Nhấn **F5 (Tải lại trang)**.
* **Kết quả:** Một tin đăng gia sư mới với nội dung *"POST CSRF thực tế qua HTML Injection"* xuất hiện ngay lập tức trong bảng danh sách lớp học của bạn!


## IV. HƯỚNG DẪN KIỂM THỬ PATH TRAVERSAL & OS COMMAND INJECTION TRÊN GIAO DIỆN CLIENT

Để tăng tính thuyết phục khi báo cáo và demo trực tiếp cho giảng viên, chúng ta sẽ thực hành khai thác trực tiếp trên giao diện Client của người dùng tại trang chi tiết CV của Gia sư.

### 1. Kịch bản Path Traversal (Rò rỉ tệp cấu hình hệ thống)
* **Mục tiêu:** Tải xuống các tệp cấu hình nhạy cảm (`application.yml`, `build.gradle`, `README.md`) từ thư mục gốc của backend server.
* **Các bước test:**
  1. Đảm bảo cờ **Path Traversal** đã được **BẬT** trong trang quản lý Sandbox.
  2. Truy cập danh sách gia sư trên giao diện Client, chọn một gia sư bất kỳ đã tải lên chứng chỉ và mở xem **CV chi tiết**.
  3. Tìm đến phần **Bằng cấp & Chứng chỉ đính kèm** và nhấp chuột vào nút **Xem tài liệu đính kèm** của chứng chỉ.
  4. Trình duyệt sẽ mở ra một tab mới với API download tệp có cấu trúc như sau:
     `http://localhost:3000/api/v1/upload/files/download?filename=[tên_file_pdf].pdf`
  5. Sửa giá trị tham số `filename` trên thanh địa chỉ URL của trình duyệt bằng một trong ba đường link khai thác sau:
     * **Link 1 - Đọc tệp cấu hình Spring Boot (application.yml):**
       `http://localhost:3000/api/v1/upload/files/download?filename=../../src/main/resources/application.yml`
     * **Link 2 - Đọc tệp cấu hình Gradle Build (build.gradle):**
       `http://localhost:3000/api/v1/upload/files/download?filename=../../build.gradle`
     * **Link 3 - Đọc tệp hướng dẫn README của dự án:**
       `http://localhost:3000/api/v1/upload/files/download?filename=../../README.md`
  6. Nhấn **Enter**:
     * **Kết quả:** Trình duyệt sẽ trực tiếp tải về tệp tin tương ứng của máy chủ, để lộ các thông tin nhạy cảm.
     * **Khi TẮT cờ Sandbox:** Gửi yêu cầu lùi thư mục `../` lập tức bị chặn đứng và trả về lỗi `400 Bad Request` kèm thông báo *"Từ chối: Tên file chứa ký tự không hợp lệ!"*.

### 2. Kịch bản OS Command Injection (Chèn lệnh hệ thống qua Ping diagnostics)
* **Mục tiêu:** Chèn thêm lệnh shell thực thi trực tiếp trên máy chủ bằng các ký tự nối lệnh.
* **Các bước test:**
  1. Đảm bảo cờ **OS Command Injection** đã được **BẬT** trong trang quản lý Sandbox.
  2. Mở **CV chi tiết** của gia sư bất kỳ trên giao diện Client.
  3. Kéo xuống phần **Chẩn đoán Website cá nhân của Gia sư (Admin Diagnostics)**.
  4. Nhập vào ô input địa chỉ website kèm lệnh chèn thêm:
     `google.com; id` hoặc `google.com; whoami`
  5. Nhấp nút **Ping kết nối**:
     * **Kết quả:** Server thực hiện nối chuỗi trực tiếp và chạy lệnh bổ sung, trả về đầu ra của lệnh `id` của OS máy chủ (ví dụ: `uid=33(www-data) gid=33(www-data)...`).
     * **Khi TẮT cờ Sandbox:** Chế độ an toàn được kích hoạt, hệ thống kiểm duyệt đầu vào chỉ cho phép IP/Domain sạch và chặn đứng toàn bộ các lệnh chèn thêm bằng thông báo lỗi trực quan.


## V. HƯỚNG DẪN KIỂM THỬ ACCESS CONTROL & JWT SANDBOX (API THỰC TẾ)

Sau khi hoàn thành tích hợp các API thật từ backend Spring Boot, bạn có thể thực hiện kiểm thử 4 nhóm lỗi kiểm soát truy cập trực quan:

### 1. Missing Authentication (Thiếu xác thực)
* **Các bước test:**
  1. Truy cập panel **Missing Authentication** trên Sandbox Dashboard.
  2. Chọn một trong hai endpoint: `/api/v1/demo/access/users` (Danh sách users) hoặc `/api/v1/demo/access/system-info` (Cấu hình hệ thống).
  3. Để trống ô nhập token và click **Gửi Request**.
  * **Kết quả Vulnerable:** Server phản hồi mã `200 OK` và trả về toàn bộ dữ liệu nhạy cảm của người dùng/hệ thống mà không cần đăng nhập.
  * **Kết quả Safe:** Server trả về mã `401 Unauthorized` chặn đứng truy cập chưa xác định danh tính.

### 2. BOLA (Broken Object Level Authorization)
* **Các bước test:**
  1. Truy cập panel **BOLA** trên Sandbox Dashboard.
  2. Xem ID tài khoản của chính bạn đang đăng nhập trên khung xanh (ví dụ: ID là 28).
  3. Click chọn các nút ID người dùng khác (1, 2, 3) để đổi tham số đường dẫn và bấm **Gửi Request**.
  * **Kết quả Vulnerable:** Server chỉ kiểm tra token hợp lệ chung chung mà không so khớp ID, cho phép đọc được thông tin chi tiết (Full Name, Phone, Address, Bank Account...) của người dùng khác.
  * **Kết quả Safe:** Server đối chiếu email/ID trong token và từ chối truy cập với mã `403 Forbidden` kèm thông báo *"Từ chối: Bạn không có quyền truy cập dữ liệu của người dùng khác!"*.

### 3. Bypass Auth (Vượt kiểm soát quyền hạn)
* **Các bước test:**
  1. Truy cập panel **Bypass Auth** trên Sandbox Dashboard.
  2. Chọn phương thức bypass muốn thử nghiệm: `?admin=true`, `X-Admin: 1`, hoặc `?role=ADMIN` và bấm **Gửi Request**.
  * **Kết quả Vulnerable:** Server tin tưởng vào các tham số tự khai báo này từ client và cấp quyền Admin, trả về dữ liệu thống kê tài chính Admin Dashboard nhạy cảm.
  * **Kết quả Safe:** Server chặn đứng và trả về mã lỗi `401/403` vì chỉ tin cậy vào session token thực tế được server kiểm soát.

### 4. JWT Weak Secret Key (Khóa bí mật JWT yếu)
* **Các bước test:**
  1. Truy cập panel **JWT Weak Secret** trên Sandbox Dashboard.
  2. Nhấp nút **Bắt đầu brute force**.
  3. Hệ thống sẽ tự động quét danh sách dictionary và phát hiện khóa bí mật yếu đang dùng trên server là `"secret"`.
  4. Web Crypto API trên trình duyệt sẽ tự động ký giả mạo một Token mới có chứa quyền `role=ADMIN` với email `admin@tutornet.vn` bằng khóa `"secret"`.
  5. Nhấp nút **Kiểm thử Token giả mạo trên Server**:
     * **Kết quả Vulnerable:** Server kiểm thử chữ ký JWT bằng khóa yếu `"secret"`, xác thực thành công chữ ký và cho phép đăng nhập Admin bằng token tự chế.
     * **Kết quả Safe:** Server kiểm thử bằng khóa mạnh của hệ thống, phát hiện chữ ký không khớp và lập tức bác bỏ token giả mạo.