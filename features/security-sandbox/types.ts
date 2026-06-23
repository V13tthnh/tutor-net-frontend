// features/security-sandbox/types.ts

export type SecurityFlag =
  | 'html_injection'
  | 'reflected_xss'
  | 'stored_xss'
  | 'dom_xss'
  | 'bypass_login'
  | 'union_sqli'
  | 'weak_password'
  | 'brute_force'
  | 'credential_stuffing'
  | 'session_hijacking'
  | 'session_fixation'
  | 'get_csrf'
  | 'post_csrf'
  | 'upload_webshell'
  | 'mime_spoofing'
  | 'ext_bypass'
  | 'path_traversal'
  | 'os_command'
  | 'missing_auth'
  | 'bola'
  | 'bypass_auth'
  | 'brute_secret_key';

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

export type VulnCategory =
  | 'Injection'
  | 'Authentication'
  | 'Session'
  | 'CSRF'
  | 'File Upload'
  | 'Access Control';

export interface VulnerabilityMeta {
  flag: SecurityFlag;
  title: string;
  titleVi: string;
  description: string;
  severity: Severity;
  category: VulnCategory;
  cwe: string;
  owasp: string;
}

export const VULNERABILITY_LIST: VulnerabilityMeta[] = [
  // ─── Injection ─────────────────────────────────────────────────────────────
  {
    flag: 'html_injection',
    title: 'HTML Injection',
    titleVi: 'HTML Injection',
    description: 'Cho phép chèn thẻ HTML tùy ý vào trang, thay đổi giao diện hoặc lừa đảo người dùng.',
    severity: 'Medium',
    category: 'Injection',
    cwe: 'CWE-80',
    owasp: 'A03:2021',
  },
  {
    flag: 'reflected_xss',
    title: 'Reflected XSS',
    titleVi: 'Reflected XSS',
    description: 'Script độc hại được phản chiếu từ request về response mà không qua encode, thực thi ngay trên trình duyệt.',
    severity: 'High',
    category: 'Injection',
    cwe: 'CWE-79',
    owasp: 'A03:2021',
  },
  {
    flag: 'stored_xss',
    title: 'Stored XSS',
    titleVi: 'Stored XSS',
    description: 'Script được lưu vào database rồi render cho mọi người dùng mà không sanitize.',
    severity: 'Critical',
    category: 'Injection',
    cwe: 'CWE-79',
    owasp: 'A03:2021',
  },
  {
    flag: 'dom_xss',
    title: 'DOM-based XSS',
    titleVi: 'DOM-based XSS',
    description: 'Dữ liệu từ nguồn không tin cậy (URL hash, localStorage) được đưa vào DOM sink như innerHTML.',
    severity: 'High',
    category: 'Injection',
    cwe: 'CWE-79',
    owasp: 'A03:2021',
  },
  {
    flag: 'union_sqli',
    title: 'UNION-based SQLi',
    titleVi: 'UNION-based SQL Injection',
    description: 'Chèn mệnh đề UNION vào query để trích xuất dữ liệu từ bảng khác trong database.',
    severity: 'Critical',
    category: 'Injection',
    cwe: 'CWE-89',
    owasp: 'A03:2021',
  },
  {
    flag: 'os_command',
    title: 'OS Command Injection',
    titleVi: 'OS Command Injection',
    description: 'Input người dùng được chuyển thẳng vào lệnh shell, cho phép chạy lệnh tùy ý trên server.',
    severity: 'Critical',
    category: 'Injection',
    cwe: 'CWE-78',
    owasp: 'A03:2021',
  },
  // ─── Authentication ─────────────────────────────────────────────────────────
  {
    flag: 'bypass_login',
    title: 'Bypass Login',
    titleVi: 'Bypass Login',
    description: 'Đăng nhập thành công mà không cần mật khẩu đúng, do logic xác thực bị vô hiệu hóa.',
    severity: 'Critical',
    category: 'Authentication',
    cwe: 'CWE-287',
    owasp: 'A07:2021',
  },
  {
    flag: 'weak_password',
    title: 'Weak Password',
    titleVi: 'Mật khẩu yếu',
    description: 'Hệ thống cho phép đặt mật khẩu đơn giản như "123456" mà không có yêu cầu độ phức tạp.',
    severity: 'Medium',
    category: 'Authentication',
    cwe: 'CWE-521',
    owasp: 'A07:2021',
  },
  {
    flag: 'brute_force',
    title: 'Brute Force Attack',
    titleVi: 'Tấn công Brute Force',
    description: 'Không giới hạn số lần thử đăng nhập, cho phép thử mật khẩu liên tục không bị chặn.',
    severity: 'High',
    category: 'Authentication',
    cwe: 'CWE-307',
    owasp: 'A07:2021',
  },
  {
    flag: 'credential_stuffing',
    title: 'Credential Stuffing',
    titleVi: 'Credential Stuffing',
    description: 'Dùng danh sách username/password bị rò rỉ để đăng nhập hàng loạt mà không bị phát hiện.',
    severity: 'High',
    category: 'Authentication',
    cwe: 'CWE-307',
    owasp: 'A07:2021',
  },
  {
    flag: 'bypass_auth',
    title: 'Bypass Auth',
    titleVi: 'Bypass Authentication',
    description: 'Thêm tham số đặc biệt vào request để bỏ qua kiểm tra phân quyền phía server.',
    severity: 'Critical',
    category: 'Authentication',
    cwe: 'CWE-306',
    owasp: 'A07:2021',
  },
  {
    flag: 'brute_secret_key',
    title: 'Brute Force Secret Key',
    titleVi: 'Brute Force JWT Secret Key',
    description: 'Thử các secret key JWT phổ biến để forge token và giả mạo session hợp lệ.',
    severity: 'Critical',
    category: 'Authentication',
    cwe: 'CWE-326',
    owasp: 'A02:2021',
  },
  // ─── Session ────────────────────────────────────────────────────────────────
  {
    flag: 'session_hijacking',
    title: 'Session Hijacking',
    titleVi: 'Session Hijacking',
    description: 'Đánh cắp session token qua XSS hoặc network sniffing và dùng để mạo danh người dùng.',
    severity: 'Critical',
    category: 'Session',
    cwe: 'CWE-384',
    owasp: 'A07:2021',
  },
  {
    flag: 'session_fixation',
    title: 'Session Fixation',
    titleVi: 'Session Fixation',
    description: 'Cố định session ID trước khi đăng nhập để chiếm session sau khi nạn nhân xác thực.',
    severity: 'High',
    category: 'Session',
    cwe: 'CWE-384',
    owasp: 'A07:2021',
  },
  // ─── CSRF ───────────────────────────────────────────────────────────────────
  {
    flag: 'get_csrf',
    title: 'GET-based CSRF',
    titleVi: 'GET-based CSRF',
    description: 'Hành động thay đổi dữ liệu được thực hiện qua GET request, dễ bị khai thác qua img src hoặc link.',
    severity: 'High',
    category: 'CSRF',
    cwe: 'CWE-352',
    owasp: 'A01:2021',
  },
  {
    flag: 'post_csrf',
    title: 'POST-based CSRF',
    titleVi: 'POST-based CSRF',
    description: 'Form tự động submit từ trang web khác thực hiện hành động dưới danh nghĩa người dùng đang đăng nhập.',
    severity: 'High',
    category: 'CSRF',
    cwe: 'CWE-352',
    owasp: 'A01:2021',
  },
  // ─── File Upload ────────────────────────────────────────────────────────────
  {
    flag: 'upload_webshell',
    title: 'Upload Webshell',
    titleVi: 'Upload Webshell',
    description: 'Upload file .php/.jsp chứa mã độc để thực thi lệnh từ xa trên server.',
    severity: 'Critical',
    category: 'File Upload',
    cwe: 'CWE-434',
    owasp: 'A04:2021',
  },
  {
    flag: 'mime_spoofing',
    title: 'MIME Spoofing',
    titleVi: 'MIME Spoofing',
    description: 'Đổi Content-Type header để upload file nguy hiểm vượt qua kiểm tra MIME type phía server.',
    severity: 'High',
    category: 'File Upload',
    cwe: 'CWE-434',
    owasp: 'A04:2021',
  },
  {
    flag: 'ext_bypass',
    title: 'Extension Bypass',
    titleVi: 'Extension Bypass',
    description: 'Đổi tên file thành dạng như shell.php.jpg để lừa server chấp nhận extension nguy hiểm.',
    severity: 'High',
    category: 'File Upload',
    cwe: 'CWE-434',
    owasp: 'A04:2021',
  },
  // ─── Access Control ─────────────────────────────────────────────────────────
  {
    flag: 'missing_auth',
    title: 'Missing Authentication',
    titleVi: 'Missing Authentication',
    description: 'Endpoint nhạy cảm không yêu cầu xác thực, bất kỳ ai cũng có thể truy cập.',
    severity: 'Critical',
    category: 'Access Control',
    cwe: 'CWE-306',
    owasp: 'A01:2021',
  },
  {
    flag: 'bola',
    title: 'BOLA',
    titleVi: 'BOLA (Broken Object Level Auth)',
    description: 'Truy cập resource của người dùng khác bằng cách thay đổi ID trong request.',
    severity: 'Critical',
    category: 'Access Control',
    cwe: 'CWE-639',
    owasp: 'A01:2021',
  },
  {
    flag: 'path_traversal',
    title: 'Path Traversal',
    titleVi: 'Path Traversal',
    description: 'Sử dụng ../ để truy cập file ngoài thư mục được phép, đọc file hệ thống nhạy cảm.',
    severity: 'High',
    category: 'Access Control',
    cwe: 'CWE-22',
    owasp: 'A01:2021',
  },
];

export const VULNERABILITY_CATEGORIES: VulnCategory[] = [
  'Injection',
  'Authentication',
  'Session',
  'CSRF',
  'File Upload',
  'Access Control',
];

export const SEVERITY_ORDER: Record<Severity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

export const ALL_FLAGS: SecurityFlag[] = VULNERABILITY_LIST.map((v) => v.flag);
