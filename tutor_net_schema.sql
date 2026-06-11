CREATE DATABASE turtor - net CREATE EXTENSION
IF NOT EXISTS "pg_trgm"; -- Tìm kiếm gần đúng (ILIKE nhanh hơn) cho tên môn học, gia sư
  
  -- ============================================================
  -- ENUM TYPES
  -- Dùng ENUM thay VARCHAR để ràng buộc giá trị hợp lệ ở tầng DB,
  -- tránh dữ liệu rác và tăng tốc so sánh.
  -- ============================================================
  DROP TYPE user_status CASCADE;
  SELECT unnest(enum_range(NULL::teaching_mode));


  CREATE TYPE user_status AS ENUM (
    'ACTIVE', -- Tài khoản hoạt động bình thường
    'INACTIVE', -- Tự nguyện tạm nghỉ / chưa đăng nhập lần nào
    'SUSPENDED', -- Bị admin khoá do vi phạm
    'PENDING_VERIFICATION' -- Mới đăng ký, chưa xác thực email
  );

  CREATE TYPE tutor_status AS ENUM (
    'DRAFT', -- Gia sư đang điền hồ sơ, chưa nộp duyệt
    'PENDING_REVIEW', -- Đã nộp hồ sơ, chờ moderator xét duyệt
    'APPROVED', -- Đã được duyệt, hiển thị trên trang tìm kiếm
    'REJECTED', -- Hồ sơ bị từ chối (kèm lý do)
    'SUSPENDED' -- Bị đình chỉ tạm thời do khiếu nại
  );
  
  CREATE TYPE session_status AS ENUM (
    'PENDING', -- Học sinh đặt lịch, chờ gia sư xác nhận
    'CONFIRMED', -- Gia sư đã xác nhận buổi học
    'ONGOING', -- Buổi học đang diễn ra
    'COMPLETED', -- Buổi học kết thúc, có thể đánh giá
    'CANCELLED', -- Đã huỷ (do gia sư hoặc học sinh)
    'NO_SHOW' -- Một bên không tham gia đúng giờ
  );

  CREATE TYPE teaching_mode AS ENUM (
    'ONLINE', -- Học qua video call (Zoom, Meet, ...)
    'OFFLINE', -- Học trực tiếp tại nhà / trung tâm
    'HYBRID' -- Linh hoạt cả hai hình thức
  );

  CREATE TYPE proficiency_lvl AS ENUM (
    'BEGINNER', -- Mới bắt đầu môn học
    'INTERMEDIATE', -- Nắm vững kiến thức cơ bản
    'ADVANCED', -- Có thể dạy nâng cao, luyện thi
    'EXPERT' -- Chuyên gia / giáo viên có bằng cấp chuyên ngành
  );
  
  CREATE TYPE proficiency_lvl AS ENUM (
    'TIỂU HỌC',
    'THCS', 
    'THPT',
    'LUYỆN THI ĐẠI HỌC', 
    'ĐẠI HỌC',
    'NGƯỜI ĐI LÀM'
  );

  CREATE TYPE edu_level AS ENUM (
    'HIGH_SCHOOL', -- Tốt nghiệp THPT
    'ASSOCIATE', -- Cao đẳng
    'BACHELOR', -- Đại học
    'MASTER', -- Thạc sĩ
    'PHD', -- Tiến sĩ
    'OTHER' -- Chứng chỉ nghề, tự học, ...
  );
  alter table tutor_profiles drop COLUMN id_card_back_url

-- 2. Trạng thái phản hồi / ứng tuyển của gia sư
DROP TYPE IF EXISTS application_status CASCADE;

CREATE TYPE application_status AS ENUM (
    'PENDING',    -- Đang chờ học viên hoặc admin xem xét lựa chọn
    'ACCEPTED',   -- Đã được chọn giao lớp
    'REJECTED'    -- Bị từ chối (Do không hợp lịch, lương hoặc đã chọn gia sư khác)
);


  -- ============================================================
  -- 1. CORE AUTH & RBAC
  -- ============================================================
  CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    NAME VARCHAR (100) NOT NULL UNIQUE, -- Tên hiển thị: 'Super Admin', 'Tutor', 'Parent', ...
    slug VARCHAR (100) NOT NULL UNIQUE, -- Định danh trong code: 'super_admin', 'tutor', ... (không dấu, không đổi)
    description TEXT, -- Mô tả ngắn về quyền hạn của role
    is_system BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE = role hệ thống, không được xoá/đổi tên qua UI
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  COMMENT ON TABLE roles IS 'Danh sách vai trò RBAC. Roles mặc định: super_admin, admin, moderator, tutor, student, parent, support. is_system=TRUE thì không cho xoá.';
  COMMENT ON COLUMN roles.slug IS 'Dùng trong code để kiểm tra role, ví dụ: IF role.slug = ''tutor''. Không thay đổi sau khi đã deploy.';
  COMMENT ON COLUMN roles.is_system IS 'Role hệ thống không được phép xoá qua UI để tránh mất phân quyền toàn bộ hệ thống.';
  
  -- Quyền hạn chi tiết theo cú pháp module:action. Thêm tính năng mới → thêm rows, không sửa code.
  CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,
    NAME VARCHAR (150) NOT NULL UNIQUE, -- Tên tiếng Việt hiển thị trong trang quản trị phân quyền
    slug VARCHAR (150) NOT NULL UNIQUE, -- Mã quyền dạng 'module:action', ví dụ: 'tutor:approve', 'payment:refund'
    module VARCHAR (100) NOT NULL, -- Nhóm chức năng: 'user', 'tutor', 'session', 'payment', 'review', 'report'
    action VARCHAR (100) NOT NULL, -- Hành động: 'create', 'read', 'update', 'delete', 'approve', 'export', ...
    description TEXT, -- Giải thích chi tiết khi nào permission này được dùng
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  COMMENT ON TABLE permissions IS 'Quyền hạn theo cú pháp module:action. Mỗi quyền độc lập, có thể gán cho nhiều role. Thêm module mới chỉ cần INSERT thêm rows.';
  COMMENT ON COLUMN permissions.slug IS 'Dạng ''module:action''. Backend đọc slug này để kiểm tra quyền, ví dụ: can(user, ''tutor:approve'').';
  COMMENT ON COLUMN permissions.module IS 'Dùng để nhóm permissions trong trang quản trị, ví dụ: hiện tất cả quyền thuộc module ''payment''.';
  COMMENT ON COLUMN permissions.action IS 'Hành động cụ thể: create, read, update, delete, approve, suspend, export, manage_all, ...';
  
  -- Bảng liên kết many-to-many giữa roles và permissions
  CREATE TABLE role_permissions (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (role_id, permission_id) -- Không gán trùng permission cho cùng role
  );
  COMMENT ON TABLE role_permissions IS 'Liên kết many-to-many roles ↔ permissions. Mỗi dòng = role X được phép thực hiện permission Y. Xoá role → tự xoá cascade.';
  
-- Bảng tài khoản trung tâm cho toàn bộ hệ thống (admin, gia sư, học sinh, phụ huynh đều ở đây)
CREATE TYPE gender_type AS ENUM (
    'MALE', 
    'FEMALE', 
    'OTHER'
  );
  
 CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR (255) NOT NULL UNIQUE, -- Dùng để đăng nhập, bắt buộc là duy nhất
    password_hash VARCHAR (255) NOT NULL, -- Bcrypt hash (cost ≥ 12)
    full_name VARCHAR (200) NOT NULL, -- Tên hiển thị trên giao diện
    phone VARCHAR (20), -- Số điện thoại (tuỳ chọn, dùng cho OTP)
    avatar_url TEXT, -- URL ảnh đại diện lưu trên S3/CDN
    GENDER gender_type NOT NULL DEFAULT 'OTHER',
    STATUS user_status NOT NULL DEFAULT 'PENDING_VERIFICATION',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE sau khi xác thực email thành công
    email_verified_at TIMESTAMPTZ, -- Thời điểm xác thực email
    last_login_at TIMESTAMPTZ, -- Lần đăng nhập gần nhất (phát hiện tài khoản bỏ trống)
    login_count INTEGER NOT NULL DEFAULT 0, -- Tổng số lần đăng nhập (analytics)
    social_links JSONB,
    birth_year DATE,
    hometown_address TEXT,
    current_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ -- Soft delete: NULL = còn hoạt động; có giá trị = đã xoá
  );
  COMMENT ON TABLE users IS 'Bảng tài khoản trung tâm. Loại tài khoản xác định qua user_roles, không phải cột riêng. Dùng soft delete (deleted_at) để giữ lịch sử giao dịch.';
  COMMENT ON COLUMN users.password_hash IS 'Bcrypt hash (cost ≥ 12). Không bao giờ lưu mật khẩu thô.';
  COMMENT ON COLUMN users.is_verified IS 'Chỉ cho phép đặt lịch hoặc dạy khi is_verified = TRUE.';
  COMMENT ON COLUMN users.deleted_at IS 'Soft delete. Mọi query nghiệp vụ phải thêm WHERE deleted_at IS NULL.';
  COMMENT ON COLUMN users.STATUS IS 'Luồng: pending_verification → active sau khi xác thực email. suspended = bị khoá.';
  
  ALTER TABLE users
ADD COLUMN address TEXT;

CREATE TABLE tutor_teaching_areas (
  id         BIGSERIAL PRIMARY KEY,
  tutor_id   BIGINT NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  province   VARCHAR(100) NOT NULL,
  ward       VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tutor_id, province, ward)
);
  
  -- Gán role cho user. Một user có thể có nhiều role (vừa là Tutor vừa là Parent).
  CREATE TABLE user_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
    assigned_by BIGINT REFERENCES users (id) ON DELETE
    SET NULL, -- Admin đã gán; NULL nếu hệ thống tự gán lúc đăng ký
    expires_at TIMESTAMPTZ, -- NULL = vĩnh viễn; có giá trị = role tự hết hạn (role tạm thời)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, role_id)
  );
  COMMENT ON TABLE user_roles IS 'Gán role cho user (many-to-many). Một user có thể có nhiều role đồng thời. Kiểm tra quyền: user → user_roles → roles → role_permissions → permissions.';
  COMMENT ON COLUMN user_roles.assigned_by IS 'Ghi lại admin đã gán để phục vụ audit. NULL nếu hệ thống tự gán lúc đăng ký.';
  COMMENT ON COLUMN user_roles.expires_at IS 'Role tạm thời. Backend lọc: WHERE expires_at IS NULL OR expires_at > NOW().';
  
  -- ============================================================
  -- 2. AUTH TOKENS
  -- ============================================================
  CREATE TABLE user_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    refresh_token VARCHAR (512) NOT NULL UNIQUE, -- Token ngẫu nhiên (SHA-256), gửi về client qua cookie HttpOnly
    ip_address INET, -- IP đăng nhập (phát hiện đăng nhập bất thường từ IP lạ)
    user_agent TEXT, -- Thiết bị / trình duyệt
    expires_at TIMESTAMPTZ NOT NULL, -- Thời hạn refresh token (thường 30–90 ngày)
    revoked_at TIMESTAMPTZ, -- NULL = còn hiệu lực; có giá trị = đã bị thu hồi (logout hoặc force logout)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  COMMENT ON TABLE user_sessions IS 'Refresh token của các phiên đăng nhập. Set revoked_at=NOW() để logout ngay lập tức kể cả token chưa hết hạn.';
  COMMENT ON COLUMN user_sessions.revoked_at IS 'Đặt giá trị này để buộc logout phiên đó ngay, dùng khi phát hiện tài khoản bị xâm phạm.';
  
  -- Token sử dụng một lần cho xác thực email, reset mật khẩu, OTP
  CREATE TABLE verification_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token VARCHAR (512) NOT NULL UNIQUE, -- Token ngẫu nhiên hoặc OTP 6 số (nên hash trước khi lưu)
    token_type VARCHAR (50) NOT NULL, -- 'email_verify' | 'password_reset' | 'phone_otp'
    expires_at TIMESTAMPTZ NOT NULL, -- Hết hiệu lực sau X phút (thường 15–60 phút)
    used_at TIMESTAMPTZ, -- NULL = chưa dùng; có giá trị = đã dùng, không dùng lại được
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  COMMENT ON TABLE verification_tokens IS 'Token một lần cho xác thực email, reset mật khẩu, OTP. Set used_at=NOW() sau khi dùng thay vì xoá để audit được. Cronjob dọn token hết hạn định kỳ.';
  COMMENT ON COLUMN verification_tokens.token_type IS '''email_verify'': link xác thực email; ''password_reset'': link đổi mật khẩu; ''phone_otp'': mã 6 số gửi SMS.';
  COMMENT ON COLUMN verification_tokens.used_at IS 'Hợp lệ khi: used_at IS NULL AND expires_at > NOW(). Sau khi dùng set used_at=NOW() để vô hiệu hoá.';
  
  -- ============================================================
  -- 3. PROFILES
  -- ============================================================
  CREATE TABLE tutor_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    headline VARCHAR (255), -- Dòng giới thiệu ngắn dưới tên trong kết quả tìm kiếm, VD: "Gia sư Toán 10 năm kinh nghiệm"
    bio TEXT, -- Giới thiệu chi tiết (Markdown hoặc rich text)
    experience_years INTEGER NOT NULL DEFAULT 0, -- Số năm kinh nghiệm giảng dạy
    education_level edu_level, -- Trình độ học vấn cao nhất
    is_available BOOLEAN NOT NULL DEFAULT TRUE, -- Gia sư có đang nhận học sinh mới không 
    teaching_mode teaching_mode NOT NULL DEFAULT 'ONLINE', -- Hình thức dạy học (có thể chọn nhiều)
    STATUS tutor_status NOT NULL DEFAULT 'DRAFT', -- Trạng thái trong luồng duyệt hồ sơ
    rating_avg NUMERIC (3, 2) NOT NULL DEFAULT 0.00, -- Điểm đánh giá TB (1.00–5.00), tự cập nhật qua trigger
    rating_count INTEGER NOT NULL DEFAULT 0, -- Tổng số lượt đánh giá công khai (hiển thị độ tin cậy)
    verified_at TIMESTAMPTZ, -- Thời điểm moderator duyệt hồ sơ
    verified_by BIGINT REFERENCES users (id) ON DELETE SET NULL, -- ID moderator đã duyệt
    occupation        VARCHAR(50),
    student_year      SMALLINT,
    major             VARCHAR(200),
    university VARCHAR(255),
    graduation_year SMALLINT,
    achievements      TEXT,           -- thành tích nổi bật (tách khỏi bio)
    id_card_front_url TEXT,           -- CCCD mặt trước
    terms_accepted_at TIMESTAMPTZ;    -- thời điểm tick cam kết
    rejection_reason TEXT
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  ); 
  COMMENT ON TABLE tutor_profiles IS 'Hồ sơ chuyên môn gia sư. Luồng duyệt: draft → pending_review → approved/rejected. Chỉ approved mới xuất hiện trong tìm kiếm. rating_avg tự cập nhật qua trigger.';
  COMMENT ON COLUMN tutor_profiles.hourly_rate IS 'Giá mặc định. Gia sư có thể đặt giá riêng từng môn trong tutor_subjects.hourly_rate (override cột này).';
  COMMENT ON COLUMN tutor_profiles.is_available IS 'Gia sư tắt để tạm dừng nhận lịch mà không cần xoá hồ sơ hay bị hạ xuống draft.';
  COMMENT ON COLUMN tutor_profiles.STATUS IS 'draft: đang soạn; pending_review: đã nộp chờ duyệt; approved: hiển thị; rejected: bị từ chối; suspended: đình chỉ.';
  COMMENT ON COLUMN tutor_profiles.rating_avg IS 'Tính lại tự động sau mỗi review qua trigger trg_update_tutor_rating. Không cập nhật thủ công.';
  COMMENT ON COLUMN tutor_profiles.teaching_modes IS 'Mảng enum, ví dụ: {''online'',''offline''}. Dùng để lọc gia sư theo hình thức học.';
  
  alter table tutor_profiles add column rejection_reason TEXT
  
  -- Bằng cấp và chứng chỉ của gia sư, moderator có thể xác thực từng chứng chỉ
  CREATE TABLE tutor_certificates (
    id BIGSERIAL PRIMARY KEY,
    tutor_id BIGINT NOT NULL REFERENCES tutor_profiles (id) ON DELETE CASCADE,
    NAME VARCHAR (255) NOT NULL, -- Tên chứng chỉ: "IELTS 8.0", "Bằng Sư phạm Toán", ...
    file_url TEXT, -- URL file scan bằng gốc trên S3 (PDF hoặc ảnh)
    is_verified BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE sau khi moderator kiểm tra file scan so với bản gốc
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  COMMENT ON TABLE tutor_certificates IS 'Bằng cấp và chứng chỉ của gia sư. Hiển thị trên hồ sơ để tăng uy tín. Chứng chỉ chưa xác thực vẫn hiển thị nhưng có nhãn "Chưa xác thực".';
  COMMENT ON COLUMN tutor_certificates.is_verified IS 'Moderator set TRUE sau khi kiểm tra file scan khớp với thực tế. Ảnh hưởng đến badge tin cậy trên hồ sơ.';
  
  -- Lịch rảnh hàng tuần lặp lại của gia sư (theo thứ và khung giờ)
  CREATE TABLE tutor_availability (
    id BIGSERIAL PRIMARY KEY,
    tutor_id BIGINT NOT NULL REFERENCES tutor_profiles (id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Chủ nhật, 1=Thứ 2, ..., 6=Thứ 7
    start_time TIME NOT NULL, -- Giờ bắt đầu rảnh (múi giờ Asia/Ho_Chi_Minh)
    end_time TIME NOT NULL, -- Giờ kết thúc rảnh
    CHECK (end_time > start_time) -- Ràng buộc không nhập ngược giờ
  );
  COMMENT ON TABLE tutor_availability IS 'Lịch rảnh hàng tuần lặp lại của gia sư. Dùng để lọc và gợi ý gia sư theo khung giờ học sinh muốn. Lịch cụ thể từng buổi ở bảng sessions.';
  COMMENT ON COLUMN tutor_availability.day_of_week IS '0=Chủ nhật, 1=Thứ 2, ..., 6=Thứ 7. Khớp với PostgreSQL EXTRACT(DOW FROM timestamp).';
  
  -- ============================================================
  -- 4. SUBJECTS / CATEGORIES
  -- ============================================================
  CREATE TABLE subjects (
    id BIGSERIAL PRIMARY KEY,
    parent_id BIGINT REFERENCES subjects (id) ON DELETE
    SET NULL, -- NULL = danh mục gốc (cấp 1)
    NAME VARCHAR (200) NOT NULL, -- Tên môn học: "Toán học", "Tiếng Anh", "IELTS", ...
    slug VARCHAR (200) NOT NULL UNIQUE, -- URL-friendly: "toan-hoc", "tieng-anh" (không thay đổi sau khi xuất bản)
    description TEXT, -- Mô tả môn học (cho trang landing page môn học)
    icon_url TEXT, -- Icon hoặc ảnh đại diện môn học
    is_active BOOLEAN NOT NULL DEFAULT TRUE, -- FALSE = ẩn khỏi tìm kiếm; không xoá để giữ lịch sử buổi học
    sort_order INTEGER NOT NULL DEFAULT 0, -- Thứ tự hiển thị trong danh sách (tăng dần)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  COMMENT ON TABLE subjects IS 'Danh mục môn học cấu trúc cây. Cấp 1: nhóm môn (Khoa học tự nhiên). Cấp 2: môn học (Toán). Cấp 3+: chuyên đề (Đại số, IELTS).';
  COMMENT ON COLUMN subjects.parent_id IS 'NULL = danh mục gốc. Có giá trị = danh mục con. Dùng CTE đệ quy để lấy toàn bộ cây.';
  COMMENT ON COLUMN subjects.slug IS 'Dùng trong URL: /subjects/toan-hoc. Không đổi sau khi đã xuất bản để tránh broken link.';
  COMMENT ON COLUMN subjects.is_active IS 'Soft disable thay vì DELETE để không ảnh hưởng đến dữ liệu sessions và tutor_subjects cũ.';
  
  -- Gia sư đăng ký dạy môn nào, mức độ thành thạo và giá riêng theo môn
  CREATE TABLE tutor_subjects (
    id BIGSERIAL PRIMARY KEY,
    tutor_id BIGINT NOT NULL REFERENCES tutor_profiles (id) ON DELETE CASCADE,
    subject_id BIGINT NOT NULL REFERENCES subjects (id) ON DELETE CASCADE,
    proficiency_level proficiency_lvl NOT NULL DEFAULT 'intermediate', -- Mức độ thành thạo môn đó
    hourly_rate NUMERIC (10, 2) NOT NULL, -- Giá dạy riêng môn này; NULL = dùng giá mặc định từ tutor_profiles.hourly_rate
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tutor_id, subject_id) -- Mỗi gia sư chỉ đăng ký mỗi môn một lần
  );
  COMMENT ON TABLE tutor_subjects IS 'Môn học gia sư có thể dạy. Dùng để tìm kiếm theo môn. hourly_rate ở đây override tutor_profiles.hourly_rate nếu không NULL.';
  COMMENT ON COLUMN tutor_subjects.hourly_rate IS 'Giá riêng cho môn này. NULL = fallback về tutor_profiles.hourly_rate. Dùng khi gia sư tính giá khác nhau mỗi môn.';

  -- ============================================================
  -- 7. REVIEWS
  -- ============================================================
DROP TABLE IF EXISTS reviews CASCADE;

CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    contract_id BIGINT NOT NULL UNIQUE REFERENCES contracts(id) ON DELETE CASCADE, 
    tutor_id BIGINT NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    reviewer_id BIGINT REFERENCES users(id) ON DELETE SET NULL, 
    guest_review_token VARCHAR(255) UNIQUE, 
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
  -- ============================================================
  -- 8. NOTIFICATIONS
  -- ============================================================
  CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type VARCHAR (100) NOT NULL, -- 'session_confirmed', 'payment_received', 'new_review', 'session_reminder', ...
    title VARCHAR (255) NOT NULL, -- Tiêu đề ngắn: "Buổi học đã được xác nhận"
    body TEXT, -- Nội dung chi tiết thông báo
    DATA JSONB, -- Payload deep link: {"session_id": 42} → frontend navigate đến màn session detail
    read_at TIMESTAMPTZ, -- NULL = chưa đọc; COUNT(*) WHERE read_at IS NULL = số badge thông báo
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  COMMENT ON TABLE notifications IS 'Thông báo in-app. Push notification (Firebase/APNs) xử lý riêng. Bảng này chỉ lưu history để hiển thị trong app.';
  COMMENT ON COLUMN notifications.type IS 'Dùng để render icon/màu sắc phù hợp và lọc thông báo theo loại trong UI.';
  COMMENT ON COLUMN notifications.DATA IS 'JSONB chứa deep link info. VD: {"session_id":42} → mở màn chi tiết buổi học khi tap.';
  COMMENT ON COLUMN notifications.read_at IS 'NULL = chưa đọc. Badge count = SELECT COUNT(*) WHERE user_id=? AND read_at IS NULL.';
  
  -- ============================================================
  -- 10. SYSTEM_SETTINGS
  -- ============================================================
  CREATE TABLE system_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE, -- Khóa cấu hình định danh (VD: 'theme_config', 'site_name')
    setting_value JSONB NOT NULL,             -- Giá trị lưu dưới dạng JSONB để linh hoạt lưu chuỗi, số, mảng, hoặc object
    setting_group VARCHAR(50) NOT NULL DEFAULT 'general', -- Nhóm cấu hình (VD: 'ui', 'system', 'payment', 'email')
    is_public BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE: Trả về cho frontend (chưa đăng nhập cũng lấy được). FALSE: Chỉ dành cho Admin.
    description TEXT,                         -- Mô tả để Admin hiểu cấu hình này dùng làm gì
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL, -- Lưu vết Admin nào đã sửa cấu hình lần cuối
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE system_settings IS 'Bảng lưu trữ cấu hình hệ thống và giao diện. Sử dụng JSONB để linh hoạt mở rộng mà không cần sửa schema.';
COMMENT ON COLUMN system_settings.setting_key IS 'Mã định danh duy nhất trong code. VD: site_logo, theme_colors.';
COMMENT ON COLUMN system_settings.setting_value IS 'Dữ liệu JSONB. Nếu là text thường vẫn lưu dưới dạng chuỗi JSON, ví dụ: "My Site Name".';
COMMENT ON COLUMN system_settings.is_public IS 'Nếu TRUE, có thể dùng API public để kéo cấu hình (VD: logo, màu sắc) ngay từ màn hình đăng nhập. FALSE dành cho API Key, cấu hình nhạy cảm.';

-- ============================================================
-- 11. PLATFORM FEES
-- ============================================================
-- Bảng cấu hình phí dịch vụ theo từng thời kỳ
CREATE TABLE platform_fees (
    id BIGSERIAL PRIMARY KEY,
    fee_type VARCHAR(50) NOT NULL, -- 'introduction_fee', 'subscription', 'commission'
    percentage_rate NUMERIC(5, 2), -- % trên giá buổi học (nếu tính %)
    fixed_amount NUMERIC(10, 2), -- Số tiền cố định (nếu tính fixed)
    currency CHAR(3) NOT NULL DEFAULT 'VND',
    effective_from DATE NOT NULL, -- Ngày bắt đầu áp dụng
    effective_to DATE, -- NULL = đang áp dụng
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE platform_fees IS 'Cấu hình phí dịch vụ nền tảng theo từng thời kỳ. Hỗ trợ cả % và số tiền cố định.';

-- Bảng ghi nhận phí của từng buổi học (snapshot)
ALTER TABLE sessions ADD COLUMN platform_fee_amount NUMERIC(10, 2);
ALTER TABLE sessions ADD COLUMN tutor_payout_amount NUMERIC(10, 2); -- Sau khi trừ phí
COMMENT ON COLUMN sessions.platform_fee_amount IS 'Phí nền tảng thu từ buổi học này (snapshot tại thời điểm đặt lịch)';
COMMENT ON COLUMN sessions.tutor_payout_amount IS 'Số tiền gia sư thực nhận sau khi trừ phí nền tảng';

-- ============================================================
-- 12. STUDY REPORTS
-- ============================================================
DROP TABLE IF EXISTS study_reports CASCADE;
DROP TYPE IF EXISTS student_progress_lvl CASCADE;
DROP TYPE IF EXISTS student_initiative_lvl CASCADE;

-- ENUM cho Mức độ tiếp thu
CREATE TYPE student_progress_lvl AS ENUM (
    'EXCELLENT',           -- Tốt
    'AVERAGE',             -- Trung bình
    'NEEDS_IMPROVEMENT'    -- Cần cố gắng thêm
);

-- ENUM cho Tính chủ động
CREATE TYPE student_initiative_lvl AS ENUM (
    'PROACTIVE',           -- Chủ động
    'NEEDS_REMINDING'      -- Phải nhắc nhở nhiều
);
CREATE TABLE study_reports (
    id BIGSERIAL PRIMARY KEY,
    
    -- Neo báo cáo vào Hợp đồng (đại diện cho 1 lớp đang diễn ra)
    contract_id BIGINT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    tutor_id BIGINT NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    
    -- Chu kỳ báo cáo
    report_month SMALLINT NOT NULL CHECK (report_month BETWEEN 1 AND 12),
    report_year INTEGER NOT NULL,
    
    -- 2. Nội dung giảng dạy (Lưu dưới dạng mảng JSONB để khỏi phải tạo thêm bảng con)
    -- Ví dụ data: [{"date": "01/01/2026", "content": "Luyện chữ", "note": "Tiếp thu tốt"}]
    session_details JSONB NOT NULL DEFAULT '[]', 
    
    -- 3. Đánh giá tổng quan
    student_progress student_progress_lvl DEFAULT 'AVERAGE', -- 'Tốt', 'Trung bình', 'Cần cố gắng thêm'
    student_initiative student_initiative_lvl DEFAULT 'NEEDS_REMINDING', -- 'Chủ động', 'Phải nhắc nhở nhiều'
    improvement_points TEXT,     -- Điểm tiến bộ
    weak_points TEXT,            -- Điểm cần cải thiện
    next_month_plan TEXT,        -- Kế hoạch giảng dạy tháng sau
    suggestion_to_parent TEXT,   -- Đề xuất với phụ huynh
    
    email_sent_at TIMESTAMPTZ,   -- Thời điểm hệ thống đã tự động gửi email cho Khách hàng
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_study_reports_updated_at BEFORE UPDATE ON study_reports
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Index để truy vấn nhanh danh sách báo cáo theo lớp học
CREATE INDEX idx_study_reports_contract ON study_reports(contract_id);
-- ============================================================
-- 14. PASSWORD RESET TOKENS
-- ============================================================  
DROP TABLE IF EXISTS password_reset_tokens CASCADE;

CREATE TABLE password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 15. ClASS REQUESTS
-- ============================================================
-- 1. Bảng lưu yêu cầu đăng lớp của học viên / lời mời dạy đích danh
DROP TYPE IF EXISTS class_request_status CASCADE;

-- 1. Trạng thái luồng đăng lớp / yêu cầu của học viên
CREATE TYPE class_request_status AS ENUM (
    'PENDING',    -- Mới đăng, đang chờ duyệt hoặc chờ gia sư vào ứng tuyển
    'APPROVED',
    'REJECTED',
    'PROCESSING', -- Đang xử lý (Admin đang liên hệ phụ huynh hoặc đang dạy thử)
    'MATCHED',    -- Đã chốt được gia sư thành công, lớp bắt đầu vào guồng
    'CANCELLED'   -- Lớp bị hủy (Học viên đổi ý, không tìm được người dạy phù hợp...)
);
DROP TABLE IF EXISTS class_requests CASCADE;

CREATE TABLE class_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL, 
    contact_name VARCHAR(100) NOT NULL,  
    contact_phone VARCHAR(20) NOT NULL,  
    contact_email VARCHAR(255),          
    
    subject_id BIGINT NOT NULL REFERENCES subjects(id),
    grade_level VARCHAR(50) NOT NULL,    
    proposed_price NUMERIC(10, 2),
    hourly_rate DECIMAL(15, 2),       
    
    -- Áp dụng kiểu dữ liệu ENUM có sẵn trong DB của bạn
    teaching_mode teaching_mode NOT NULL DEFAULT 'ONLINE', 
    sessions_per_week SMALLINT NOT NULL DEFAULT 2, -- Số buổi / tuần
    duration_minutes SMALLINT NOT NULL DEFAULT 90,
    
    
    address_detail TEXT,                 
    student_notes TEXT,                  
    target_tutor_id BIGINT REFERENCES tutor_profiles(id) ON DELETE SET NULL, 
    
    -- Áp dụng kiểu dữ liệu ENUM trạng thái mới tạo
    status class_request_status NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT SET NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Bảng lưu danh sách gia sư ứng tuyển vào lớp học trên
DROP TABLE IF EXISTS class_applications CASCADE;

CREATE TABLE class_applications (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES class_requests(id) ON DELETE CASCADE,
    tutor_id BIGINT NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    
    -- Áp dụng kiểu dữ liệu ENUM trạng thái ứng tuyển mới tạo
    status application_status NOT NULL DEFAULT 'PENDING', 
    
    message TEXT, 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(request_id, tutor_id)
);

-- Thêm các chỉ mục (Index) để tối ưu hóa tốc độ tìm kiếm lớp và đếm số lượng
CREATE INDEX idx_class_requests_status ON class_requests(status);
CREATE INDEX idx_class_apps_request ON class_applications(request_id);

-- ============================================================
-- 13. CONTRACTS
-- ============================================================  
CREATE TYPE contract_status AS ENUM ('DRAFT', 'PENDING_SIGNATURE', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'VIOLATED');

DROP TABLE IF EXISTS contracts CASCADE;

-- 3. Tạo bảng contracts mới chuẩn hóa
CREATE TABLE contracts (
    id BIGSERIAL PRIMARY KEY,
    contract_number VARCHAR(100) UNIQUE,
    
    -- Liên kết FK
    request_id BIGINT NOT NULL REFERENCES class_requests(id) ON DELETE CASCADE,
    tutor_id BIGINT NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    
    -- Thông tin tài chính
    introduction_fee NUMERIC(10, 2) NOT NULL,
    fee_payment_deadline DATE,
    is_fee_paid BOOLEAN NOT NULL DEFAULT FALSE,
    paid_at TIMESTAMPTZ,
    
    -- Thông tin thời gian & Trạng thái
    effective_date DATE NOT NULL,
    status contract_status NOT NULL DEFAULT 'DRAFT', -- Nếu dùng MySQL thì thay bằng VARCHAR(50)
    free_trial_count INTEGER NOT NULL DEFAULT 1,
    
    -- Lưu trữ file & Pháp lý điện tử (Clickwrap)
    contract_file_url TEXT,
    ip_address VARCHAR(50),
    signed_at TIMESTAMPTZ,
    
    -- Tracking
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Thêm Index để truy vấn nhanh (Tối ưu performance)
CREATE INDEX idx_contracts_request_id ON contracts(request_id);
CREATE INDEX idx_contracts_tutor_id ON contracts(tutor_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_deadline ON contracts(fee_payment_deadline) WHERE is_fee_paid = FALSE;

CREATE TABLE tutor_invitations (
    id BIGSERIAL PRIMARY KEY,
    
    -- Khóa ngoại liên kết tới Gia sư nhận lời mời
    tutor_id BIGINT NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    
    -- Lưu ID học viên nếu họ đã đăng nhập (Khách vãng lai thì để NULL)
    student_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    
    -- Thông tin liên hệ của học viên/phụ huynh
    student_name VARCHAR(100) NOT NULL,
    student_phone VARCHAR(20) NOT NULL,
    student_email VARCHAR(100) NOT NULL,
    
    -- Lời nhắn tùy chọn
    message TEXT,
    
    -- Trạng thái lời mời
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- Nếu dùng PostgreSQL Enum thì đổi thành invitation_status
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tạo Index để tối ưu tốc độ khi gia sư tải danh sách lời mời
CREATE INDEX idx_tutor_invitations_tutor_id ON tutor_invitations(tutor_id);
  -- ============================================================
  -- INDEXES
  -- ============================================================
  CREATE INDEX idx_users_email ON users (email);
  CREATE INDEX idx_users_status ON users (STATUS)
  WHERE
    deleted_at IS NULL;
  CREATE INDEX idx_users_deleted ON users (deleted_at)
  WHERE
    deleted_at IS NOT NULL;
  CREATE INDEX idx_user_roles_user ON user_roles (user_id);
  CREATE INDEX idx_user_roles_role ON user_roles (role_id);
  CREATE INDEX idx_tutor_user ON tutor_profiles (user_id);
  CREATE INDEX idx_tutor_status ON tutor_profiles (STATUS);
  CREATE INDEX idx_tutor_rating ON tutor_profiles (rating_avg DESC)
  WHERE
    STATUS = 'approved'; -- Top gia sư
  CREATE INDEX idx_tutor_subjects_rate ON tutor_subjects (hourly_rate);
  CREATE INDEX idx_ts_tutor ON tutor_subjects (tutor_id);
  CREATE INDEX idx_ts_subject ON tutor_subjects (subject_id);
  CREATE INDEX idx_avail_tutor ON tutor_availability (tutor_id);
  CREATE INDEX idx_review_reviewee ON reviews (reviewee_id);
  CREATE INDEX idx_review_session ON reviews (session_id);
  CREATE INDEX idx_notif_user_unread ON notifications (user_id, created_at DESC)
  WHERE
    read_at IS NULL;
  CREATE INDEX idx_subject_name_trgm ON subjects USING gin (NAME gin_trgm_ops); -- Tìm kiếm gần đúng tên môn học
  

  -- Index để truy vấn nhanh theo nhóm và các cấu hình public
  CREATE INDEX idx_system_settings_group ON system_settings(setting_group);
  CREATE INDEX idx_system_settings_public ON system_settings(is_public) WHERE is_public = TRUE;
  -- ============================================================
  -- TRIGGERS
  -- ============================================================
  -- Tự động cập nhật updated_at khi row thay đổi
  CREATE
  OR REPLACE FUNCTION set_updated_at () RETURNS TRIGGER LANGUAGE plpgsql AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$;
  COMMENT ON FUNCTION set_updated_at IS 'Tự động set updated_at=NOW() trên mọi UPDATE. Gán cho tất cả bảng có cột updated_at.';
  CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW
    EXECUTE FUNCTION set_updated_at ();
    CREATE TRIGGER trg_tutor_updated_at BEFORE UPDATE ON tutor_profiles FOR EACH ROW
      EXECUTE FUNCTION set_updated_at ();
            CREATE TRIGGER trg_review_updated_at BEFORE UPDATE ON reviews FOR EACH ROW
              EXECUTE FUNCTION set_updated_at ();
              
              -- Tự động tính lại rating_avg và rating_count sau mỗi review INSERT/UPDATE
              CREATE
              OR REPLACE FUNCTION update_tutor_rating () RETURNS TRIGGER LANGUAGE plpgsql AS $$ DECLARE
              v_tutor_id BIGINT;
              BEGIN
                SELECT
                  id INTO v_tutor_id
                FROM
                  tutor_profiles
                WHERE
                  user_id = NEW.reviewee_id;
                IF v_tutor_id IS NOT NULL THEN
                  UPDATE tutor_profiles
                  SET rating_avg = (
                    SELECT
                      COALESCE(ROUND(AVG(rating) :: NUMERIC, 2), 0.00)
                    FROM
                      reviews
                    WHERE
                      reviewee_id = NEW.reviewee_id
                      AND is_public = TRUE
                  ),
                  rating_count = (SELECT COUNT(*) FROM reviews WHERE reviewee_id = NEW.reviewee_id AND is_public = TRUE)
                  WHERE
                    id = v_tutor_id;
                END IF;
                RETURN NEW;
              END;
              $$;
              COMMENT ON FUNCTION update_tutor_rating IS 'Tính lại rating_avg và rating_count sau mỗi INSERT/UPDATE review. Chỉ tính review có is_public=TRUE. Đảm bảo rating luôn nhất quán, không cần cron.';
              CREATE TRIGGER trg_update_tutor_rating AFTER INSERT
              OR UPDATE ON reviews FOR EACH ROW
                EXECUTE FUNCTION update_tutor_rating ();
                
                -- ============================================================
                -- SEED DATA — Roles & Permissions
                -- ============================================================
                INSERT INTO roles (NAME, slug, description, is_system)
                VALUES
                ('Super Admin', 'super_admin', 'Toàn quyền hệ thống, chỉ dành cho kỹ thuật viên cấp cao', TRUE),
                ('Admin', 'admin', 'Quản trị nội dung, người dùng và vận hành hàng ngày', TRUE),
                ('Moderator', 'moderator', 'Kiểm duyệt hồ sơ gia sư, đánh giá và nội dung vi phạm', TRUE),
                ('Tutor', 'tutor', 'Gia sư đã đăng ký và được duyệt trên nền tảng', TRUE),
                ('Parent', 'parent', 'Phụ huynh quản lý và thanh toán thay học sinh', TRUE),
                ('Support', 'support', 'Nhân viên CSKH nội bộ, xử lý khiếu nại và hoàn tiền', TRUE);
                INSERT INTO permissions (NAME, slug, module, action, description)
                VALUES
                -- USER
                ('Xem danh sách người dùng', 'user:read', 'user', 'read', 'Xem thông tin tài khoản của mọi user'),
                ('Tạo tài khoản người dùng', 'user:create', 'user', 'create', 'Tạo tài khoản mới từ trang quản trị'),
                ('Cập nhật thông tin người dùng', 'user:update', 'user', 'update', 'Sửa thông tin profile, email, tên'),
                ('Xoá tài khoản người dùng', 'user:delete', 'user', 'delete', 'Soft delete tài khoản (set deleted_at)'),
                ('Khoá / mở khoá tài khoản', 'user:suspend', 'user', 'suspend', 'Chuyển status sang suspended hoặc active'),
                ('Gán vai trò cho người dùng', 'user:assign_role', 'user', 'assign_role', 'Thêm / xoá role trong bảng user_roles'),
                -- TUTOR
                ('Xem hồ sơ gia sư', 'tutor:read', 'tutor', 'read', 'Xem thông tin chuyên môn, chứng chỉ gia sư'),
                ('Cập nhật hồ sơ của bản thân', 'tutor:update_self', 'tutor', 'update_self', 'Gia sư tự chỉnh sửa hồ sơ của mình'),
                ('Duyệt / từ chối hồ sơ', 'tutor:approve', 'tutor', 'approve', 'Moderator phê duyệt hoặc từ chối hồ sơ gia sư'),
                ('Xuất danh sách gia sư', 'tutor:export', 'tutor', 'export', 'Tải file CSV/Excel danh sách gia sư'),
                -- SESSION
                ('Xem lịch sử buổi học', 'session:read', 'session', 'read', 'Xem thông tin buổi học của bản thân'),
                ('Đặt buổi học', 'session:create', 'session', 'create', 'Tạo đặt lịch buổi học mới'),
                ('Huỷ buổi học', 'session:cancel', 'session', 'cancel', 'Huỷ buổi học theo chính sách'),
                ('Xác nhận buổi học', 'session:confirm', 'session', 'confirm', 'Gia sư xác nhận nhận buổi học'),
                ('Quản lý tất cả buổi học', 'session:manage_all', 'session', 'manage_all', 'Admin/Support xem và can thiệp mọi buổi học'),
                -- REVIEW
                ('Xem đánh giá', 'review:read', 'review', 'read', 'Xem các đánh giá công khai'),
                ('Tạo đánh giá', 'review:create', 'review', 'create', 'Viết đánh giá sau buổi học hoàn thành'),
                ('Kiểm duyệt đánh giá', 'review:moderate', 'review', 'moderate', 'Ẩn/hiện đánh giá vi phạm tiêu chuẩn cộng đồng'),
                -- PAYMENT
                ('Xem lịch sử thanh toán', 'payment:read', 'payment', 'read', 'Xem giao dịch của bản thân hoặc toàn hệ thống'),
                ('Hoàn tiền giao dịch', 'payment:refund', 'payment', 'refund', 'Xử lý hoàn tiền khi có khiếu nại hợp lệ'),
                ('Xuất báo cáo tài chính', 'payment:export', 'payment', 'export', 'Tải báo cáo doanh thu theo kỳ'),
                -- SUBJECT
                ('Quản lý danh mục môn học', 'subject:manage', 'subject', 'manage', 'Thêm, sửa, ẩn môn học trong danh mục'),
                -- REPORT
                ('Xem báo cáo thống kê', 'report:read', 'report', 'read', 'Xem dashboard phân tích và báo cáo'),
                ('Xuất báo cáo', 'report:export', 'report', 'export', 'Tải file báo cáo về máy');
                
 -- Super Admin: toàn bộ permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id 
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;
                  
                -- Admin
                INSERT INTO role_permissions (role_id, permission_id) SELECT
                  r.id,
                  p.id
                FROM
                  roles r,
                  permissions p
                WHERE
                  r.slug = 'admin'
                  AND p.slug IN (
                    'user:read',
                    'user:create',
                    'user:update',
                    'user:suspend',
                    'user:assign_role',
                    'tutor:read',
                    'tutor:approve',
                    'tutor:export',
                    'session:read',
                    'session:manage_all',
                    'review:read',
                    'review:moderate',
                    'payment:read',
                    'payment:refund',
                    'payment:export',
                    'subject:manage',
                    'report:read',
                    'report:export'
                  );
                  
                -- Moderator: chỉ kiểm duyệt nội dung
                INSERT INTO role_permissions (role_id, permission_id) SELECT
                  r.id,
                  p.id
                FROM
                  roles r,
                  permissions p
                WHERE
                  r.slug = 'moderator'
                  AND p.slug IN ('tutor:read', 'tutor:approve', 'review:read', 'review:moderate', 'report:read');
                  
                -- Tutor
                INSERT INTO role_permissions (role_id, permission_id) SELECT
                  r.id,
                  p.id
                FROM
                  roles r,
                  permissions p
                WHERE
                  r.slug = 'tutor'
                  AND p.slug IN ('tutor:update_self', 'session:read', 'session:confirm', 'session:cancel', 'review:read', 'review:create');
                  
                -- Parent
                INSERT INTO role_permissions (role_id, permission_id) SELECT
                  r.id,
                  p.id
                FROM
                  roles r,
                  permissions p
                WHERE
                  r.slug = 'parent'
                  AND p.slug IN ('tutor:read', 'session:read', 'session:create', 'session:cancel', 'review:read', 'payment:read');
                  
                -- Support: hỗ trợ khách hàng
                INSERT INTO role_permissions (role_id, permission_id) SELECT
                  r.id,
                  p.id
                FROM
                  roles r,
                  permissions p
                WHERE
                  r.slug = 'support'
                  AND p.slug IN ('user:read', 'session:read', 'session:manage_all', 'payment:read', 'payment:refund', 'review:read');

                INSERT INTO subjects (NAME, slug, sort_order)
                VALUES
                ('Toán học', 'toan-hoc', 1),
                ('Ngữ văn', 'ngu-van', 2),
                ('Tiếng Anh', 'tieng-anh', 3),
                ('Vật lý', 'vat-ly', 4),
                ('Hoá học', 'hoa-hoc', 5),
                ('Sinh học', 'sinh-hoc', 6),
                ('Lịch sử', 'lich-su', 7),
                ('Địa lý', 'dia-ly', 8),
                ('Tin học', 'tin-hoc', 9),
                ('Lập trình', 'lap-trinh', 10),
                ('Tiếng Nhật', 'tieng-nhat', 11),
                ('Tiếng Trung', 'tieng-trung', 12),
                ('Tiếng Hàn', 'tieng-han', 13),
                ('Âm nhạc', 'am-nhac', 14),
                ('Mỹ thuật', 'my-thuat', 15),
                ('Thể dục - Thể thao', 'the-duc', 16);
                
INSERT INTO permissions (name, slug, module, action, description) VALUES
-- Role management
('Xem danh sách gia sư',         'role:read',              'role', 'read',              'Xem danh sách và chi tiết các vai trò trong hệ thống'),
('Tạo vai trò mới',               'role:create',            'role', 'create',            'Tạo vai trò mới với tên và mô tả'),
('Cập nhật thông tin vai trò',    'role:update',            'role', 'update',            'Sửa tên, mô tả của vai trò'),
('Xoá vai trò',                   'role:delete',            'role', 'delete',            'Xoá vai trò khỏi hệ thống (chỉ khi không còn user nào giữ role)'),
('Gán permission cho vai trò',    'role:assign_permission', 'role', 'assign_permission', 'Thêm / xoá permission trong danh sách quyền của một vai trò'),
('Xem permission của vai trò',    'role:read_permission',   'role', 'read_permission',   'Xem danh sách permission đang được gán cho vai trò'),

-- Permission management
('Xem danh sách permission',      'permission:read',        'permission', 'read',        'Xem toàn bộ danh sách permission trong hệ thống'),
('Tạo permission mới',            'permission:create',      'permission', 'create',      'Tạo permission mới (module, action, slug, description)'),
('Cập nhật permission',           'permission:update',      'permission', 'update',      'Sửa thông tin permission: name, description'),
('Xoá permission',                'permission:delete',      'permission', 'delete',      'Xoá permission khỏi hệ thống (chỉ khi không còn role nào sử dụng)'),

-- Role-User assignment (tách riêng khỏi user:assign_role để kiểm soát chi tiết hơn)
('Xem user theo vai trò',         'role:read_user',         'role', 'read_user',         'Xem danh sách user đang giữ một vai trò cụ thể'),
('Gán vai trò cho user',          'role:assign_user',       'role', 'assign_user',       'Thêm vai trò cho một user'),
('Thu hồi vai trò khỏi user',     'role:revoke_user',       'role', 'revoke_user',       'Xoá vai trò đang giữ khỏi một user'),

-- Audit / export
('Xuất danh sách role & permission', 'role:export',         'role', 'export',            'Tải file CSV/Excel toàn bộ cấu hình role và permission');


INSERT INTO permissions (name, slug, module, action, description) VALUES
('Xem các yêu cầu tạo lớp học',    'class_request:read',     'class_request',   'read',   'Xem các yêu cầu tạo lớp họ'),
('Quản yêu cầu tạo lớp học',       'class_request:manage',   'class_request',   'manage', 'Quản yêu cầu tạo lớp học'),
('Duyệt yêu cầu tạo lớp học',      'class_request:review',   'class_request',   'review', 'Duyệt yêu cầu tạo lớp học'),
('Xoá yêu cầu tạo lớp học',        'class_request:delete',   'class_request',   'delete', 'Xoá yêu cầu tạo lớp học'),


INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'admin'
  AND p.slug IN (
    'class_request:read',
'class_request:manage',
'class_request:review',
'class_request:delete'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;


INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.slug IN (
'class_request:read',
'class_request:manage',
'class_request:review',
'class_request:delete'
)
WHERE r.module = 'class_request'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 1. Xóa các bảng con cấp 2 của Gia sư
DELETE FROM tutor_teaching_areas;
DELETE FROM tutor_availability;
DELETE FROM tutor_certificates;
DELETE FROM tutor_subjects;

-- 2. Xóa bảng con cấp 1 của Gia sư
DELETE FROM tutor_profiles;



DO $$
DECLARE
    v_user_id BIGINT;
    v_tutor_id BIGINT;
    v_tutor_role_id BIGINT;
    v_student_role_id BIGINT;
    v_subject_math_id BIGINT;
    v_subject_english_id BIGINT;
    -- Tạo email ngẫu nhiên theo thời gian để không bị lỗi trùng lặp khi chạy nhiều lần
    v_test_email VARCHAR := 'test_tutor_' || extract(epoch from now())::integer || '@gmail.com'; 
BEGIN
    -- =========================================================================
    -- LẤY CÁC ID CẦN THIẾT (Không thêm, xoá, sửa bảng roles/subjects)
    -- =========================================================================
    SELECT id INTO v_tutor_role_id FROM roles WHERE slug = 'tutor';
    SELECT id INTO v_student_role_id FROM roles WHERE slug = 'student';

    SELECT id INTO v_subject_math_id FROM subjects WHERE slug = 'toan-hoc' LIMIT 1;
    SELECT id INTO v_subject_english_id FROM subjects WHERE slug = 'tieng-anh' LIMIT 1;

    -- =========================================================================
    -- 1. THÊM TÀI KHOẢN MỚI (Mật khẩu mặc định: 123456)
    -- Hash $2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HCGFGLxO0s4jZJ/6F/xJi tương đương "123456"
    -- =========================================================================
    INSERT INTO users (
        email, password_hash, full_name, phone, gender, 
        status, is_verified, email_verified_at, current_address
    ) VALUES (
        v_test_email, 
        '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HCGFGLxO0s4jZJ/6F/xJi', 
        'Trần Văn Sinh (Test User Mới)', 
        '0999888777', 
        'MALE', 
        'ACTIVE', 
        TRUE, 
        NOW(),
        'Quận 1 | TP. Hồ Chí Minh'
    ) RETURNING id INTO v_user_id;

    -- =========================================================================
    -- 2. GÁN 2 QUYỀN: TUTOR VÀ STUDENT
    -- =========================================================================
    IF v_tutor_role_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id) VALUES (v_user_id, v_tutor_role_id);
    END IF;
    
    IF v_student_role_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id) VALUES (v_user_id, v_student_role_id);
    END IF;


    -- =========================================================================
    -- 4. THÊM HỒ SƠ GIA SƯ
    -- =========================================================================
    INSERT INTO tutor_profiles (
        user_id, headline, bio, experience_years, education_level, 
        is_available, teaching_modes, status, occupation, 
        major, university, graduation_year, achievements
    ) VALUES (
        v_user_id, 
        'Gia sư Tiếng Anh & Toán - 3 năm kinh nghiệm', 
        'Phương pháp dạy sát thực tế, tập trung cải thiện giao tiếp và nền tảng cốt lõi.', 
        3, 
        'BACHELOR', 
        TRUE, 
        '{ONLINE, OFFLINE}', 
        'APPROVED', 
        'Giáo viên tự do', 
        'Ngôn ngữ Anh', 
        'ĐH KHXH & Nhân văn', 
        2024, 
        '- IELTS 8.0'
    ) RETURNING id INTO v_tutor_id;

    -- =========================================================================
    -- 5. THÊM DỮ LIỆU CÁC BẢNG LIÊN QUAN (MÔN, LỊCH, CHỨNG CHỈ)
    -- =========================================================================

    -- A. Khu vực giảng dạy
    INSERT INTO tutor_teaching_areas (tutor_id, province, ward) VALUES 
    (v_tutor_id, 'Hồ Chí Minh', 'Quận 1'),
    (v_tutor_id, 'Hồ Chí Minh', 'Quận 3');

    -- B. Đăng ký môn dạy (Kiểm tra null trước để tránh lỗi nếu chưa có môn trong DB)
    IF v_subject_math_id IS NOT NULL THEN
        INSERT INTO tutor_subjects (tutor_id, subject_id, proficiency_level, hourly_rate)
        VALUES (v_tutor_id, v_subject_math_id, 'ADVANCED', 200000.00);
    END IF;

    IF v_subject_english_id IS NOT NULL THEN
        INSERT INTO tutor_subjects (tutor_id, subject_id, proficiency_level, hourly_rate)
        VALUES (v_tutor_id, v_subject_english_id, 'EXPERT', 300000.00);
    END IF;

    -- C. Thêm lịch rảnh (Tối T3, T5, T7)
    INSERT INTO tutor_availability (tutor_id, day_of_week, start_time, end_time) VALUES 
    (v_tutor_id, 2, '19:00', '21:00'), -- Thứ 3
    (v_tutor_id, 4, '19:00', '21:00'), -- Thứ 5
    (v_tutor_id, 6, '19:00', '21:00'); -- Thứ 7

    -- D. Bằng cấp/Chứng chỉ
    INSERT INTO tutor_certificates (tutor_id, name, file_url, is_verified) VALUES 
    (v_tutor_id, 'Bằng Cử nhân Sư phạm', '/uploads/certs/bang-dai-hoc-test.jpg', TRUE),
    (v_tutor_id, 'Chứng chỉ IELTS 8.0', '/uploads/certs/ielts-test.pdf', FALSE);

    -- =========================================================================
    -- THÔNG BÁO KẾT QUẢ ĐỂ BẠN LẤY EMAIL ĐĂNG NHẬP
    -- =========================================================================
    RAISE NOTICE 'ĐÃ TẠO THÀNH CÔNG!';
    RAISE NOTICE 'Email đăng nhập: %', v_test_email;
    RAISE NOTICE 'Mật khẩu: 123456';
    
END $$;

CREATE OR REPLACE FUNCTION array_contains_teaching_mode(
    arr teaching_mode[],
    val text
) RETURNS boolean AS $$
    SELECT val::teaching_mode = ANY(arr)
$$ LANGUAGE sql IMMUTABLE;
