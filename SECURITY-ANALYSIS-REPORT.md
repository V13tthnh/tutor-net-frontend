# BÁO CÁO PHÂN TÍCH BIỆN PHÁP PHÒNG CHỐNG 22 LỖ HỔNG BẢO MẬT (PRODUCTION VS SANDBOX DEMO)
## DỰ ÁN TUTORNET (FRONTEND NEXT.JS & BACKEND SPRING BOOT)

Báo cáo này cung cấp kết quả phân tích chi tiết về mã nguồn của cả hai phân hệ **Frontend (Next.js)** và **Backend (Spring Boot API)** nhằm đánh giá khả năng phòng chống đối với **22 lỗ hổng bảo mật**.

> [!IMPORTANT]
> **Nguyên tắc phân tích:**
> * Báo cáo này **tách biệt rõ ràng** giữa **Mã nguồn thực tế (Production Code)** chạy hệ thống và **Mã nguồn mô phỏng (Sandbox Demo)** nằm trong các file controller của package `com.tutornet.tutor_net.controller.sandbox`.
> * Các đoạn mã chỉ tồn tại trong package `sandbox` chỉ mang tính chất tham khảo/demo lỗi cho giảng viên và **không** được tính là đã triển khai bảo vệ trong thực tế.

---

## I. BẢNG THỐNG KÊ TRẠNG THÁI TRIỂN KHAI THỰC TẾ TRÊN TOÀN HỆ THỐNG

Dưới đây là bảng phân loại chi tiết trạng thái của 22 lỗ hổng bảo mật trên hệ thống chính (ngoài package sandbox):

| STT | Lỗ hổng bảo mật (Flag) | Phân loại | Mức độ | Trạng thái bảo vệ trên thực tế | Vị trí file nguồn chính (Production Code) | Hàm / Cơ chế xử lý thực tế |
|:---:|---|---|:---:|:---:|---|---|
| **1** | HTML Injection (`html_injection`) | Injection | Medium | **Đã triển khai** | [tutor-grid.tsx](file:///f:/TutorNet/tutor-net-next-ui/tutor-net-next-app/features/tutors/components/tutor-grid.tsx)<br>[my-classes-list.tsx](file:///f:/TutorNet/tutor-net-next-ui/tutor-net-next-app/features/classes/components/my-classes-list.tsx) | Render mặc định qua JSX React `{variable}` tự động escape HTML entities. |
| **2** | Reflected XSS (`reflected_xss`) | Injection | High | **Đã triển khai** | Toàn bộ Next.js Pages & Spring Boot Controllers | Auto-escaping của React và API trả về định dạng `application/json` thuần túy. |
| **3** | Stored XSS (`stored_xss`) | Injection | Critical | **An toàn tự nhiên** | Toàn bộ Next.js Pages | Hệ thống chỉ render văn bản thô qua JSX React. *Chưa tích hợp DOMPurify trong code chính*. |
| **4** | DOM-based XSS (`dom_xss`) | Injection | High | **An toàn tự nhiên** | Toàn bộ Next.js Pages | Không sử dụng ghi DOM thô qua `innerHTML` với nguồn dữ liệu phía client trong code chính. |
| **5** | UNION-based SQLi (`union_sqli`) | Injection | Critical | **Đã triển khai** | Gói [com.tutornet.tutor_net.repository](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/repository) | Spring Data JPA / Hibernate JPQL tự động biên dịch sang Prepared Statement. |
| **6** | OS Command Injection (`os_command`) | Injection | Critical | **Đã triển khai** | [UploadController.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/controller/UploadController.java) | Hàm `pingWebsite()`: Whitelist Regex `^[a-zA-Z0-9.-]+$` và dùng `ProcessBuilder` (args list). |
| **7** | Bypass Login (`bypass_login`) | Authentication | Critical | **Đã triển khai** | [AbstractLoginProcessor.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/service/AbstractLoginProcessor.java) | Hàm `authenticate()`: Parameterized Query và khớp băm mật khẩu `passwordEncoder.matches()` qua BCrypt. |
| **8** | Mật khẩu yếu (`weak_password`) | Authentication | Medium | **Đã triển khai** | [AuthServiceImpl.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/service/impl/AuthServiceImpl.java) | Hàm `registerClient()`: Kiểm tra biểu thức chính quy (Regex) bắt buộc độ phức tạp của mật khẩu. |
| **9** | Brute Force Attack (`brute_force`) | Authentication | High | **Đã triển khai** | [AbstractLoginProcessor.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/service/AbstractLoginProcessor.java) | Hàm `processLogin()` gọi `RateLimiterService` để đếm số lần đăng nhập sai và khóa 15 phút. |
| **10** | Credential Stuffing (`credential_stuffing`) | Authentication | High | **Chưa triển khai** | Không có trong code chính | *Chỉ có mã giả lập trong package sandbox*. |
| **11** | Bypass Auth (`bypass_auth`) | Authentication | Critical | **Đã triển khai** | [JwtAuthenticationFilter.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/config/JwtAuthenticationFilter.java) | Giải mã và kiểm tra vai trò người dùng trong JWT Access Token. Bỏ qua hoàn toàn các header tự chế. |
| **12** | Brute JWT Key (`brute_secret_key`) | Authentication | Critical | **Đã triển khai** | [JwtServiceImpl.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/service/impl/JwtServiceImpl.java) | Hàm `getSignKey()`: Giải mã bằng Signature Key mạnh lấy từ biến môi trường `jwt.secret`. |
| **13** | Session Hijacking (`session_hijacking`) | Session | Critical | **Đã triển khai** | [session.server.ts](file:///f:/TutorNet/tutor-net-next-ui/tutor-net-next-app/features/auth/lib/session.server.ts)<br>[route.ts](file:///f:/TutorNet/tutor-net-next-ui/tutor-net-next-app/app/api/%5B...path%5D/route.ts) | Hàm `setClientSession()` / `applySessionCookies()`: Ghi cookie JWT với cờ `httpOnly` và `secure`. |
| **14** | Session Fixation (`session_fixation`) | Session | High | **An toàn tự nhiên** | [SecurityConfig.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/config/SecurityConfig.java) | Cấu hình `SessionCreationPolicy.STATELESS`. Hệ thống không sử dụng session database ở backend. |
| **15** | GET-based CSRF (`get_csrf`) | CSRF | High | **An toàn tự nhiên** | Toàn bộ Spring Boot API | Hệ thống xác thực bằng JWT Bearer Token qua Header Authorization. Không lưu phiên qua cookie ở backend. |
| **16** | POST-based CSRF (`post_csrf`) | CSRF | High | **An toàn tự nhiên** | [route.ts](file:///f:/TutorNet/tutor-net-next-ui/tutor-net-next-app/app/api/%5B...path%5D/route.ts) | Cookie API Proxy chứa cờ `SameSite=Lax`. Xác thực API backend qua Authorization header. |
| **17** | Upload Webshell (`upload_webshell`) | File Upload | Critical | **Đã triển khai** | [FileStorageServiceImpl.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/service/impl/FileStorageServiceImpl.java) | Hàm `storeAvatar()` / `storeDocument()`: Đổi tên file thành UUID ngẫu nhiên và lưu ở thư mục cách ly. |
| **18** | MIME Spoofing (`mime_spoofing`) | File Upload | High | **Chưa triển khai** | Không có trong code chính | *Chưa có hàm đọc Magic Bytes trong code chính*. Mới chỉ kiểm tra Content-Type từ client gửi lên. |
| **19** | Extension Bypass (`ext_bypass`) | File Upload | High | **Đã triển khai** | [FileStorageServiceImpl.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/service/impl/FileStorageServiceImpl.java) | Hàm `getExtension()` lấy phần đuôi mở rộng ở cuối cùng (sau dấu chấm cuối) và đối chiếu Whitelist. |
| **20** | Path Traversal (`path_traversal`) | Access Control | High | **Đã triển khai** | [UploadController.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/controller/UploadController.java) | Hàm `downloadFile()`: Chặn ký tự lùi thư mục (`/`, `\`, `..`) và kiểm tra `startsWith` của thư mục an toàn. |
| **22** | Missing Auth (`missing_auth`) | Access Control | Critical | **Đã triển khai** | [SecurityConfig.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/config/SecurityConfig.java) | Hàm `securityFilterChain()`: Cấu hình Spring Security yêu cầu token xác thực cho tất cả API nhạy cảm. |
| **22** | BOLA / IDOR (`bola`) | Access Control | Critical | **Đã triển khai** | [UserController.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/controller/UserController.java)<br>[ContractServiceImpl.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/service/impl/ContractServiceImpl.java) | Hàm `updateUserProfile()`, `signContractAndGeneratePdf()`, `exportContractPdfForUser()`: So khớp ID/email từ JWT. |

---

## II. CHI TIẾT PHÂN TÍCH TỪNG LỖ HỔNG TRÊN MÃ NGUỒN CHÍNH (PRODUCTION CODE)

### 1. HTML Injection (`html_injection`)
* **Trạng thái:** **ĐÃ TRIỂN KHAI**
* **Vị trí file nguồn:** [tutor-grid.tsx](file:///f:/TutorNet/tutor-net-next-ui/tutor-net-next-app/features/tutors/components/tutor-grid.tsx) (Dòng 148-168) và [my-classes-list.tsx](file:///f:/TutorNet/tutor-net-next-ui/tutor-net-next-app/features/classes/components/my-classes-list.tsx).
* **Cơ chế xử lý thực tế:** 
  * Khi tắt cờ sandbox, các trang Next.js hiển thị dữ liệu tìm kiếm do người dùng nhập bằng cơ chế kết xuất JSX tiêu chuẩn của React: `<span>"{searchValForHtml}"</span>`. 
  * JSX của React tự động escape (mã hóa các ký tự đặc biệt của HTML thành thực thể an toàn như `<` thành `&lt;`), ngăn chặn việc trình duyệt thực thi các thẻ HTML do người dùng chèn vào.

### 2. Reflected XSS (`reflected_xss`)
* **Trạng thái:** **ĐÃ TRIỂN KHAI**
* **Vị trí file nguồn:** Toàn bộ hệ thống client-side Next.js và các endpoint REST Controller của Spring Boot.
* **Cơ chế xử lý thực tế:**
  * Client sử dụng cơ chế auto-escaping mặc định của React. 
  * Toàn bộ API thực tế của Spring Boot trả về dữ liệu thô định dạng `application/json` chứ không trả về mã HTML có phản chiếu chuỗi nhập từ URL. Trình duyệt client hiểu đây là dữ liệu JSON và không bao giờ cố gắng biên dịch hay thực thi mã JavaScript từ payload phản chiếu.

### 3. Stored XSS (`stored_xss`)
* **Trạng thái:** **AN TOÀN TỰ NHIÊN (Chưa tích hợp DOMPurify)**
* **Vị trí file nguồn:** Toàn bộ Next.js Pages.
* **Cơ chế xử lý thực tế:**
  * Mã nguồn chính của dự án không hỗ trợ nhập rich-text nên không lưu trữ mã HTML. Mọi dữ liệu bình luận, giới thiệu được lưu dưới dạng chuỗi văn bản thô (plain text) trong cơ sở dữ liệu.
  * Khi hiển thị, React render mặc định thô qua JSX nên tuyệt đối an toàn. Việc dùng thư viện **DOMPurify** để làm sạch mã HTML rich-text chỉ được viết mô phỏng trong các file sandbox demo ([interceptor.tsx](file:///f:/TutorNet/tutor-net-next-ui/tutor-net-next-app/features/security-sandbox/components/interceptor.tsx)) và chưa áp dụng trong luồng nghiệp vụ thực tế ngoài sandbox.

### 4. DOM-based XSS (`dom_xss`)
* **Trạng thái:** **AN TOÀN TỰ NHIÊN (Chưa tích hợp)**
* **Vị trí file nguồn:** Toàn bộ Next.js Pages.
* **Cơ chế xử lý thực tế:**
  * Trong mã nguồn Next.js chính, không có bất kỳ logic nào đọc trực tiếp từ nguồn không đáng tin cậy (như `window.location.hash`) rồi dùng lệnh JavaScript thao tác DOM thô ghi vào thuộc tính `.innerHTML`.
  * Vì React sử dụng Virtual DOM và dữ liệu kết xuất an toàn qua JSX nên lỗ hổng này không xuất hiện. Đoạn mã lỗi ghi `innerHTML` chỉ được tạo giả lập trong panel mô phỏng `dom-xss-panel.tsx`.

### 5. UNION-based SQL Injection (`union_sqli`)
* **Trạng thái:** **ĐÃ TRIỂN KHAI**
* **Vị trí file nguồn:** Gói repository [com.tutornet.tutor_net.repository](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/repository) (ví dụ: [UserRepository.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/repository/UserRepository.java)).
* **Cơ chế xử lý thực tế:**
  * Toàn bộ mã nguồn chính của ứng dụng sử dụng Spring Data JPA (`JpaRepository`). Các phương thức truy vấn như JPQL (`@Query("SELECT u FROM User u WHERE u.email = :email")`) hoặc các Query Method tự sinh (`findByEmail`) đều tự động biên dịch thành Prepared Statement của JDBC.
  * Tham số được truyền tách biệt dưới dạng giá trị biên, cơ sở dữ liệu không bao giờ biên dịch dữ liệu đầu vào thành mã lệnh SQL, ngăn chặn triệt để UNION-based SQLi. (File `SqliUnionController.java` chỉ là mô phỏng cộng chuỗi SQL thủ công).

### 6. OS Command Injection (`os_command`)
* **Trạng thái:** **ĐÃ TRIỂN KHAI**
* **Vị trí file nguồn:** [UploadController.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/controller/UploadController.java) (Dòng 181-193).
* **Cơ chế xử lý thực tế:**
  * Trong hàm chẩn đoán/ping website của gia sư `pingWebsite(String host)`: khi cờ sandbox tắt, server áp dụng kiểm tra địa chỉ đầu vào bằng biểu thức chính quy (Regex Whitelist): `Pattern.compile("^[a-zA-Z0-9.-]+$")`. Nếu host chứa ký tự đặc biệt nối lệnh shell (như `;`, `&`, `|`), yêu cầu sẽ bị chặn ngay lập tức.
  * Việc thực thi lệnh ping sử dụng **ProcessBuilder** nhận mảng tham số phân tách: `new ProcessBuilder("ping", "-n", "1", "-w", "1000", host)`, gọi tiến trình OS trực tiếp mà không đi qua bộ phân giải shell của hệ điều hành, triệt tiêu hoàn toàn khả năng Command Injection.

### 7. Bypass Login (`bypass_login`)
* **Trạng thái:** **ĐÃ TRIỂN KHAI**
* **Vị trí file nguồn:** [AbstractLoginProcessor.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/service/AbstractLoginProcessor.java) (Dòng 84-110).
* **Cơ chế xử lý thực tế:**
  * Hàm xác thực `authenticate(String email, String password)` của luồng đăng nhập chính sử dụng JPA repository để truy vấn thông tin người dùng theo email bằng Prepared Statement an toàn. 
  * Sau đó so khớp mật khẩu băm thông qua `BCryptPasswordEncoder` của Spring Security. Không có cơ chế cộng chuỗi SQL thô sơ trong luồng đăng nhập thật, ngăn chặn hoàn toàn việc bypass qua SQL Injection.

### 8. Mật khẩu Yếu (`weak_password`)
* **Trạng thái:** **ĐÃ TRIỂN KHAI**
* **Vị trí file nguồn:** [AuthServiceImpl.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/service/impl/AuthServiceImpl.java) (Dòng 63-82).
* **Cơ chế xử lý thực tế:**
  * Khi người dùng đăng ký tài khoản trong hàm `registerClient`, hệ thống kiểm tra mật khẩu bằng biểu thức chính quy để ép buộc chính sách mật khẩu mạnh: độ dài tối thiểu 8 ký tự, có ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt. Nếu không thỏa mãn, yêu cầu đăng ký sẽ bị bác bỏ và báo lỗi chi tiết ra màn hình.

### 9. Brute Force Attack (`brute_force`)
* **Trạng thái:** **ĐÃ TRIỂN KHAI**
* **Vị trí file nguồn:** [AbstractLoginProcessor.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/service/AbstractLoginProcessor.java) (Dòng 42-79) phối hợp với [RateLimiterServiceImpl.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/service/impl/RateLimiterServiceImpl.java).
* **Cơ chế xử lý thực tế:**
  * Luồng đăng nhập chính trong `processLogin` sử dụng `RateLimiterService` để đếm số lần đăng nhập sai.
  * Nếu đăng nhập sai liên tiếp quá 5 lần (`MAX_ATTEMPTS`), tài khoản sẽ bị lưu trạng thái khóa trong vòng 15 phút (`BLOCK_MINUTES`) bằng `rateLimiterService.recordFailedAttempt`. Bất kỳ yêu cầu đăng nhập nào trong thời gian này đều bị chặn ở đầu hàm bằng `rateLimiterService.isBlocked`.

### 10. Credential Stuffing (`credential_stuffing`)
* **Trạng thái:** **CHƯA TRIỂN KHAI**
* **Vị trí file nguồn:** Không có trong mã nguồn chính.
* **Cơ chế xử lý thực tế:**
  * Mã nguồn chính của dự án chưa tích hợp cơ chế chống Credential Stuffing nâng cao (như đối chiếu mật khẩu đăng ký với danh sách các mật khẩu bị rò rỉ toàn cầu Pwned Passwords hoặc kích hoạt CAPTCHA khi phát hiện lưu lượng đăng nhập tự động lớn). Luồng xử lý và API đối chiếu credential stuffing chỉ được xây dựng giả lập bên trong `AuthVulnController.java` của package `sandbox`.

### 11. Bypass Authentication (`bypass_auth`)
* **Trạng thái:** **ĐÃ TRIỂN KHAI**
* **Vị trí file nguồn:** [JwtAuthenticationFilter.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/config/JwtAuthenticationFilter.java) và [SecurityConfig.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/config/SecurityConfig.java).
* **Cơ chế xử lý thực tế:**
  * Bộ lọc `JwtAuthenticationFilter` trích xuất token từ header `Authorization: Bearer <token>`, giải mã chữ ký JWT trên server để lấy thông tin định danh và phân quyền.
  * Hệ thống hoàn toàn bỏ qua mọi tham số URL như `?role=admin` hay các header tùy ý từ client gửi lên để gán quyền. Phân quyền API được kiểm soát chặt chẽ bằng cấu hình Spring Security.

### 12. Brute Force Secret Key (`brute_secret_key`)
* **Trạng thái:** **ĐÃ TRIỂN KHAI**
* **Vị trí file nguồn:** [JwtServiceImpl.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/service/impl/JwtServiceImpl.java) (Dòng 28-32).
* **Cơ chế xử lý thực tế:**
  * Khóa bí mật dùng để ký và xác thực chữ ký JWT được lấy từ cấu hình môi trường bên ngoài mã nguồn (`@Value("${jwt.secret}")`). Khóa này được sinh ngẫu nhiên với độ dài lớn (đảm bảo độ phức tạp tối thiểu 256-bit), ngăn chặn các cuộc tấn công brute force để giải mã hoặc giả mạo chữ ký token JWT.

### 13. Session Hijacking (`session_hijacking`)
* **Trạng thái:** **ĐÃ TRIỂN KHAI**
* **Vị trí file nguồn:** [session.server.ts](file:///f:/TutorNet/tutor-net-next-ui/tutor-net-next-app/features/auth/lib/session.server.ts) (Hàm `setClientSession()`) và [route.ts](file:///f:/TutorNet/tutor-net-next-ui/tutor-net-next-app/app/api/%5B...path%5D/route.ts) (Hàm `applySessionCookies()`).
* **Cơ chế xử lý thực tế:**
  * Phiên làm việc (JWT Token) được lưu trữ trong cookie của trình duyệt (`client_access_token`, `client_refresh_token`).
  * Khi cờ sandbox tắt, hàm thiết lập cookie luôn gán cờ `httpOnly: true` (ngăn mã JavaScript đọc cookie phiên qua `document.cookie`) và `secure: process.env.NODE_ENV === "production"` (chỉ gửi cookie qua kênh HTTPS đã mã hóa), bảo vệ token khỏi bị đánh cắp bởi mã độc XSS hoặc nghe lén mạng.

### 14. Session Fixation (`session_fixation`)
* **Trạng thái:** **AN TOÀN TỰ NHIÊN (Chưa tích hợp)**
* **Vị trí file nguồn:** [SecurityConfig.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/config/SecurityConfig.java).
* **Cơ chế xử lý thực tế:**
  * Backend Spring Boot được thiết lập chạy ở chế độ **Stateless API** (`SessionCreationPolicy.STATELESS`), hoàn toàn không sử dụng cơ chế lưu phiên làm việc (HTTP Session) hay sinh Session ID truyền thống trên server.
  * Vì xác thực hoàn toàn bằng JWT Bearer Token, cơ chế tấn công Session Fixation (cố định session ID trước khi đăng nhập) không thể thực hiện được trên hệ thống thực tế. Cơ chế cookie thô sơ và Session Fixation chỉ được tạo ra giả lập ở `SessionController.java` trong package `sandbox`.

### 15. GET-based CSRF (`get_csrf`) & 16. POST-based CSRF (`post_csrf`)
* **Trạng thái:** **AN TOÀN TỰ NHIÊN (Chưa tích hợp CSRF Token thật)**
* **Vị trí file nguồn:** Toàn bộ Spring Boot API và Next.js API Proxy.
* **Cơ chế xử lý thực tế:**
  * Backend API tắt cơ chế CSRF bảo vệ mặc định của Spring Security (`.csrf(AbstractHttpConfigurer::disable)`) vì hệ thống sử dụng Stateless API xác thực qua JWT Bearer Token gửi trong Header `Authorization`. Do trình duyệt không tự động đính kèm header này khi có yêu cầu cross-origin, hệ thống được bảo vệ an toàn tự nhiên khỏi CSRF.
  * Next.js API Proxy thiết lập cookie phiên có thuộc tính `sameSite: "lax"`, giúp chặn trình duyệt tự động gửi cookie khi có yêu cầu POST liên trang. Hệ thống không thiết lập cơ chế sinh và kiểm tra mã CSRF Token (`X-CSRF-Token`) cho các yêu cầu thay đổi dữ liệu thực tế (logic này chỉ có trong `CsrfController.java` của package `sandbox`).

### 17. Upload Webshell (`upload_webshell`)
* **Trạng thái:** **ĐÃ TRIỂN KHAI**
* **Vị trí file nguồn:** [FileStorageServiceImpl.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/service/impl/FileStorageServiceImpl.java) (Hàm `storeAvatar()` / `storeDocument()`).
* **Cơ chế xử lý thực tế:**
  * Khi người dùng tải ảnh đại diện hoặc chứng chỉ lên, hệ thống thực tế luôn đổi tên tệp tin sang chuỗi ngẫu nhiên duy nhất UUID: `String fileName = UUID.randomUUID() + "." + ext`. Việc đổi tên giúp hacker không thể biết được tên file thực tế để gọi chạy trực tiếp.
  * Đồng thời, tệp tin được lưu trữ ở thư mục cách ly nằm ngoài thư mục tài nguyên chạy mã của máy chủ, và tắt quyền thực thi script (Execution Permission) trên thư mục lưu trữ này.

### 18. MIME Spoofing (`mime_spoofing`)
* **Trạng thái:** **CHƯA TRIỂN KHAI**
* **Vị trí file nguồn:** Không có trong mã nguồn chính.
* **Cơ chế xử lý thực tế:**
  * Mã nguồn chính của dự án chỉ kiểm tra định dạng tệp tin thông qua thuộc tính `file.getContentType()` do trình duyệt khai báo gửi lên và kiểm tra extension của file. 
  * Hệ thống chưa tích hợp cơ chế đọc Magic Bytes (đọc nội dung byte đầu tiên) để xác thực cấu trúc thực tế của tệp tin tải lên. Hàm check Magic Bytes `validateMagicBytes()` chỉ được định nghĩa trong controller mô phỏng `FileUploadSecurityController.java` của package `sandbox`.

### 19. Extension Bypass (`ext_bypass`)
* **Trạng thái:** **ĐÃ TRIỂN KHAI**
* **Vị trí file nguồn:** [FileStorageServiceImpl.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/service/impl/FileStorageServiceImpl.java) (Hàm `storeAvatar()` / `storeDocument()`).
* **Cơ chế xử lý thực tế:**
  * Hệ thống trích xuất phần đuôi mở rộng cuối cùng bằng cách tìm kiếm dấu chấm cuối cùng của tên file: `filename.substring(filename.lastIndexOf(".") + 1).toLowerCase()`. Đuôi file này được so khớp chặt chẽ với danh sách Whitelist an toàn (`jpg`, `jpeg`, `png`, `webp`, `gif`, `pdf`).
  * Cơ chế lấy extension cuối cùng giúp ngăn chặn hoàn toàn các kỹ thuật lách bộ lọc dùng nhiều đuôi file như `shell.php.jpg` hay `shell.jpg.php`.

### 20. Path Traversal (`path_traversal`)
* **Trạng thái:** **ĐÃ TRIỂN KHAI**
* **Vị trí file nguồn:** [UploadController.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/controller/UploadController.java) (Hàm `downloadFile()`).
* **Cơ chế xử lý thực tế:**
  * Khi người dùng yêu cầu tải xuống file chứng chỉ bằng tên file:
    1. Server kiểm tra và từ chối xử lý ngay lập tức nếu tham số tên file chứa các ký tự điều hướng lùi thư mục: `if (filename.contains("/") || filename.contains("\\") || filename.contains(".."))`.
    2. Sử dụng cơ chế chuẩn hóa đường dẫn tuyệt đối: `Path resolved = documentsDir.resolve(filename).normalize().toAbsolutePath()`. Server xác minh đường dẫn chuẩn hóa đích phải bắt đầu bằng đường dẫn tuyệt đối của thư mục lưu trữ tài liệu hợp lệ: `if (!filePath.startsWith(documentsDir)) { return 403; }`.

### 21. Missing Authentication (`missing_auth`)
* **Trạng thái:** **ĐÃ TRIỂN KHAI**
* **Vị trí file nguồn:** [SecurityConfig.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/config/SecurityConfig.java) (Dòng 48-70).
* **Cơ chế xử lý thực tế:**
  * Cấu hình phân quyền HTTP Request của Spring Security định nghĩa rõ các API công cộng được phép truy cập tự do (`permitAll()`). Toàn bộ các API nghiệp vụ nhạy cảm khác đều bắt buộc phải được xác thực danh tính: `.anyRequest().authenticated()`. Yêu cầu không có JWT token hợp lệ sẽ bị chặn đứng tại bộ lọc Security và trả về lỗi 401.

### 22. BOLA / IDOR (`bola`)
* **Trạng thái:** **ĐÃ TRIỂN KHAI**
* **Vị trí file nguồn:** [UserController.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/controller/UserController.java) và [ContractServiceImpl.java](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/java/com/tutornet/tutor_net/service/impl/ContractServiceImpl.java).
* **Cơ chế xử lý thực tế:**
  * **Trang cá nhân:** API lấy và cập nhật thông tin profile của người dùng (`getUserById`, `updateUserProfile`...) hoàn toàn bỏ qua các tham số ID truyền trên đường dẫn từ client. Server luôn lấy ID người dùng trực tiếp từ token JWT đã xác thực thông qua `@AuthenticationPrincipal CustomUserDetails currentUser`.
  * **Hợp đồng điện tử:** Trong hàm ký hợp đồng `signContractAndGeneratePdf` và tải PDF `exportContractPdfForUser` của `ContractServiceImpl.java`, server đối chiếu ID của người dùng hiện tại từ JWT với ID của gia sư hoặc học viên liên kết với hợp đồng đó: `!contract.getTutor().getUser().getId().equals(currentUserId)`. Nếu không trùng khớp, server từ chối xử lý và ném lỗi 403 Forbidden.

---

## III. TỔNG KẾT ĐÁNH GIÁ AN TOÀN

1. **Phần đã hoàn thành (Production Ready)**: Hệ thống chính đã triển khai rất tốt các biện pháp bảo vệ cốt lõi: **SQL Injection, OS Command Injection, Path Traversal, Bypass Login, Brute force, Bypass Auth, Session Hijacking, Missing Auth, BOLA, và Extension Bypass**.
2. **Phần an toàn tự nhiên**: Nhờ sử dụng kiến trúc hiện đại (Next.js React và API stateless xác thực qua header JWT Bearer Token), hệ thống được bảo vệ an toàn mặc định trước các lỗ hổng **HTML Injection, Reflected XSS, Session Fixation, và các cuộc tấn công CSRF thông thường** mà không cần viết code phòng vệ phức tạp.
3. **Phần còn thiếu trên hệ thống thực tế (Chỉ có trong sandbox demo)**: Hệ thống chính chưa áp dụng cơ chế chống **MIME Spoofing** bằng cách đọc Magic Bytes của file upload và chưa có cơ chế chống **Credential Stuffing** nâng cao (các cơ chế này mới chỉ được viết giả lập ở package `sandbox` để phục vụ giảng dạy).
