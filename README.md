# 🚀 TutorNet - Hệ thống kết nối Gia sư, Học sinh và Phụ huynh

TutorNet là một nền tảng web hiện đại giúp kết nối trực tiếp giữa **Gia sư (Tutors)**, **Học sinh (Students)** và **Phụ huynh (Parents)**. Hệ thống cung cấp các giải pháp quản lý hồ sơ gia sư, yêu cầu mở lớp, quản lý hợp đồng giảng dạy điện tử, thanh toán học phí qua cổng VNPay, thông báo thời gian thực và quản lý lịch học chi tiết.

---

## 🛠️ Công nghệ & Thư viện sử dụng (Tech Stack & Libraries)

Dự án được phát triển theo kiến trúc tách biệt rõ ràng giữa **Frontend (Client UI)** và **Backend (RESTful API)**.

### 1. Frontend (Next.js App)
Nằm trong thư mục `tutor-net-next-ui/tutor-net-next-app`. Sử dụng **Next.js 16 (App Router)** và **React 19** với trình quản lý gói **Bun**.

| Nhóm chức năng | Thư viện sử dụng | Vai trò & Ứng dụng |
| :--- | :--- | :--- |
| **Framework & Core** | `next` (16.1.7), `react` (19.2.4) | Khung ứng dụng chính, Server-side Rendering & Client-side components |
| **Styling & Theme** | `tailwindcss` (v4), `next-themes`, `clsx`, `tailwind-merge`, `cva` | Giao diện hiện đại, responsive, hỗ trợ Dark Mode và animation mượt mà |
| **State Management** | `zustand` (v5.0.13), `nuqs` (v2.8.9) | Quản lý state toàn cục (Zustand) và đồng bộ state của bộ lọc/tìm kiếm trực tiếp lên URL Search Params (Nuqs) |
| **Data Fetching & Cache** | `@tanstack/react-query` (v5) | Fetch dữ liệu API, tự động caching, revalidation và đồng bộ trạng thái server |
| **Forms & Validation** | `@tanstack/react-form` | Xây dựng và xác thực dữ liệu form an toàn (Type-safe) |
| **Bảng dữ liệu** | `@tanstack/react-table` (v8) | Quản lý danh sách, phân trang, sắp xếp và lọc dữ liệu (tutors, contracts, requests) |
| **UI Components** | `shadcn/ui`, `radix-ui`, `cmdk`, `kbar` | Tập hợp các component giao diện dễ tiếp cận (Accessible), hỗ trợ Menu Command (Kbar) |
| **Thông báo (Toasts)** | `sonner` | Hệ thống toast popup góc màn hình (đã tùy biến hiệu ứng spring easing mượt mà ở `globals.css`) |
| **Icons & Charts** | `lucide-react`, `tabler/icons-react`, `recharts` | Biểu tượng vector sắc nét và biểu đồ thống kê tài chính/lớp học |
| **Realtime Connection** | `@stomp/stompjs`, `sockjs-client` | Kết nối WebSocket để nhận thông báo thời gian thực từ Backend |

### 2. Backend (Spring Boot API)
Nằm trong thư mục `tutor-net-spring-boot-api`. Sử dụng **Spring Boot 4.0.6** trên nền tảng **Java 21**.

| Nhóm chức năng | Thư viện sử dụng | Vai trò & Ứng dụng |
| :--- | :--- | :--- |
| **Core Framework** | `spring-boot-starter-web` | Định nghĩa REST APIs cho toàn bộ hệ thống |
| **Database & ORM** | `spring-boot-starter-data-jpa`, `postgresql` | Tương tác cơ sở dữ liệu PostgreSQL thông qua Hibernate |
| **Migrations** | `flyway-core`, `flyway-database-postgresql` | Quản lý phiên bản database schema qua các script SQL tự động chạy |
| **Security & Auth** | `spring-boot-starter-security`, `jjwt` (v0.12.5) | Xác thực người dùng bằng JWT Token (stateless) kết hợp phân quyền chi tiết (RBAC) bằng Custom PermissionEvaluator |
| **Realtime Messaging** | `spring-boot-starter-websocket`, `netty-socketio` | Cung cấp luồng giao tiếp WebSocket STOMP & Socket.IO tốc độ cao |
| **PDF Generation** | `thymeleaf`, `openhtmltopdf-pdfbox` | Xuất hợp đồng giảng dạy điện tử dạng bản xem trước và file PDF |
| **Excel/CSV Export** | `poi-ooxml` (v5.2.3) | Đọc và ghi dữ liệu danh sách báo cáo, thống kê ra file Excel |
| **Mailing Service** | `spring-boot-starter-mail` | Gửi email kích hoạt tài khoản, lời mời dạy học và thông báo thay đổi trạng thái |
| **Tiện ích code** | `lombok`, `mapstruct` | Tự động sinh boilerplate code (getter, setter, builder) và ánh xạ dữ liệu DTO - Entity |

---

## ⚙️ Yêu cầu hệ thống (Prerequisites)

Trước khi khởi chạy dự án, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:
* **Java Development Kit (JDK) 21**
* **Node.js v20+** & **Bun Package Manager** (`npm install -g bun`)
* **PostgreSQL Server v15+**
* **Redis Server** (Tùy chọn, cấu hình lưu session & cache)

---

## 🚀 Hướng dẫn khởi chạy ứng dụng (Setup & Running)

### Bước 1: Cấu hình Cơ sở dữ liệu (Database Setup)
1. Đăng nhập vào PostgreSQL và tạo một database mới tên là `tutor_net`:
   ```sql
   CREATE DATABASE tutor_net;
   ```
2. Mở file [application.yml](file:///f:/TutorNet/tutor-net-spring-boot-api/src/main/resources/application.yml) của backend hoặc khai báo các biến môi trường tương ứng (xem phần cấu hình bên dưới).

---

### Bước 2: Chạy Backend (Spring Boot API)
1. Di chuyển thư mục terminal đến thư mục gốc của backend:
   ```bash
   cd f:/TutorNet/tutor-net-spring-boot-api
   ```
2. Cấu hình các biến môi trường cần thiết (ví dụ mật khẩu DB PostgreSQL của bạn):
   * **Windows (PowerShell)**:
     ```powershell
     $env:DB_USERNAME="postgres"
     $env:DB_PASSWORD="your_postgres_password"
     $env:JWT_SECRET="viet-nam-tutor-net-secrect-key-at-least-256-bits-long"
     ```
   * **Linux/macOS**:
     ```bash
     export DB_USERNAME="postgres"
     export DB_PASSWORD="your_postgres_password"
     export JWT_SECRET="viet-nam-tutor-net-secrect-key-at-least-256-bits-long"
     ```
3. Chạy ứng dụng bằng Gradle wrapper:
   * **Windows**:
     ```powershell
     .\gradlew.bat bootRun
     ```
   * **Linux/macOS**:
     ```bash
     ./gradlew bootRun
     ```
4. API sẽ chạy tại địa chỉ: `http://localhost:8080/api/v1`

---

### Bước 3: Chạy Frontend (Next.js Client)
1. Di chuyển thư mục terminal đến thư mục gốc của frontend:
   ```bash
   cd f:/TutorNet/tutor-net-next-ui/tutor-net-next-app
   ```
2. Cài đặt toàn bộ các thư viện phụ thuộc bằng **Bun**:
   ```bash
   bun install
   ```
3. Tạo file cấu hình môi trường `.env.local` (nếu chưa có) và điền các giá trị:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
4. Chạy dự án ở chế độ phát triển (Development mode):
   ```bash
   bun dev
   ```
5. Mở trình duyệt và truy cập: `http://localhost:3000`

---

## 🗂️ Cấu trúc thư mục dự án nổi bật

### Backend Structure (Domain-driven Feature Package)
* `config/`: Chứa các cấu hình bảo mật `SecurityConfig.java`, JWT, Cache, WebMvc CORS, Socket.IO.
* `common/`: Chứa các class dùng chung, xử lý Exception toàn cục (`GlobalExceptionHandler.java`), định nghĩa BaseEntity và các Base Service (Design Pattern Template Method).
* `domain/`: Phân nhóm nghiệp vụ theo tính năng:
  * `auth/`: Xử lý đăng ký, đăng nhập, JWT, quản lý phiên làm việc.
  * `user/`: Quản lý người dùng và vai trò bảo mật (RBAC).
  * `tutor/`: Đăng ký làm gia sư, duyệt hồ sơ (TutorApprovalService sử dụng Template Method).
  * `student/` & `parent/`: Hồ sơ học sinh, phụ huynh và liên kết gia đình.
  * `session/`: Lịch học, các buổi học thử & chính thức.
  * `payment/`: Tích hợp ví gia sư, nạp tiền và xử lý thanh toán qua cổng VNPay.
  * `contract/`: Quản lý hợp đồng điện tử giảng dạy.
* `db/migration/`: Chứa các file SQL của Flyway để khởi tạo database schema và dữ liệu mẫu (Seed roles, permissions, subjects).

### Frontend Structure (Next.js App router)
* `app/`: Định nghĩa các Router page của Next.js (Dashboard học viên, Admin, Gia sư, Chi tiết lớp học).
* `components/`: Các components dùng chung cấp hệ thống (Layout, UI Shadcn primitives, Navigation, Global providers).
* `features/`: Phân chia logic giao diện theo nghiệp vụ chính:
  * `auth/`: Form đăng nhập, đăng ký, xác thực token.
  * `tutors/`: Tìm kiếm gia sư, bộ lọc lọc theo khu vực/môn học, trang chi tiết và modal mời dạy.
  * `classes/`: Đăng yêu cầu tìm gia sư, ứng tuyển lớp.
  * `contracts/`: Danh sách hợp đồng, màn hình xem trước và ký hợp đồng trực tuyến.
  * `admin/`: Trang quản lý hệ thống của Admin (Duyệt hồ sơ gia sư, xử lý tranh chấp hợp đồng, quản lý tài khoản).
* `styles/globals.css`: Nơi override các CSS toàn cục và định nghĩa transition mượt mà cho toast của Sonner.
