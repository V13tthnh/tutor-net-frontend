import * as z from 'zod';
export { GENDER_OPTIONS } from '../api/types';

const EMAIL_STRICT_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_PATTERN = /^[0-9+\-\s]{7,20}$/;
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s])\S+$/;
export const PASSWORD_MESSAGE = 'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt, không chứa khoảng trắng';

// ─── Schema chính (tạo mới) ────────────────────────────────────────────────────
// Matches CreateAdminRequest:
//   fullName (required, 2-200), email (required), phone (optional),
//   password (required, 8-100, pattern), confirmPassword (required), status, roleIds
export const userSchema = z.object({
  first_name: z.string()
    .min(1, 'Họ tên không được để trống')
    .min(2, 'Họ tên phải từ 2 đến 200 ký tự')
    .max(200, 'Họ tên phải từ 2 đến 200 ký tự'),
  email: z.string()
    .min(1, 'Email không được để trống')
    .max(255, 'Email không được vượt quá 255 ký tự')
    .regex(EMAIL_STRICT_PATTERN, 'Email không đúng định dạng'),
  // phone: optional theo server (pattern: ^$|^[0-9+\-\s]{7,20}$)
  phone: z.string()
    .max(20, 'Số điện thoại không được vượt quá 20 ký tự')
    .refine((val) => val === '' || PHONE_PATTERN.test(val), {
      message: 'Số điện thoại không hợp lệ (7–20 ký tự, chỉ gồm số, +, -, khoảng trắng)'
    })
    .optional()
    .or(z.literal('')),
  role: z.string().min(1, 'Vui lòng chọn vai trò'),
  status: z.string().min(1, 'Vui lòng chọn trạng thái'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  // password: bắt buộc khi tạo mới (NotBlank, 8-100 chars, pattern)
  password: z.string()
    .min(1, 'Mật khẩu không được để trống')
    .min(8, 'Mật khẩu phải từ 8 đến 100 ký tự')
    .max(100, 'Mật khẩu không được vượt quá 100 ký tự')
    .regex(PASSWORD_PATTERN, PASSWORD_MESSAGE),
  confirm_password: z.string()
    .min(1, 'Xác nhận mật khẩu không được để trống')
    .min(8, 'Mật khẩu phải từ 8 đến 100 ký tự')
    .max(100, 'Mật khẩu không được vượt quá 100 ký tự')
    .regex(PASSWORD_PATTERN, PASSWORD_MESSAGE)
}).refine((data) => data.password === data.confirm_password, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirm_password']
});

// ─── Tab 1: Thông tin người dùng (edit mode) ─────────────────────────────────────────
// Matches UpdateAdminRequest:
//   fullName, email, phone (optional), province, ward, address,
//   socialLinks (optional), password (optional), confirmPassword (optional), status, roleIds
export const userInfoSchema = z.object({
  first_name: z.string()
    .min(1, 'Họ tên không được để trống')
    .min(2, 'Họ tên phải từ 2 đến 200 ký tự')
    .max(200, 'Họ tên phải từ 2 đến 200 ký tự'),
  email: z.string()
    .min(1, 'Email không được để trống')
    .max(255, 'Email không được vượt quá 255 ký tự')
    .regex(EMAIL_STRICT_PATTERN, 'Email không đúng định dạng'),
  phone: z.string()
    .max(20, 'Số điện thoại không được vượt quá 20 ký tự')
    .refine((val) => val === '' || PHONE_PATTERN.test(val), {
      message: 'Số điện thoại không hợp lệ (7–20 ký tự, chỉ gồm số, +, -, khoảng trắng)'
    })
    .optional()
    .or(z.literal('')),
  province: z.string()
    .min(1, 'Tỉnh/Thành không được để trống')
    .max(100, 'Tỉnh/Thành không được vượt quá 100 ký tự'),
  ward: z.string()
    .min(1, 'Xã/Phường không được để trống')
    .max(100, 'Xã/Phường không được vượt quá 100 ký tự'),
  address: z.string()
    .min(1, 'Địa chỉ không được để trống')
    .max(500, 'Địa chỉ không được vượt quá 500 ký tự'),
  // socialLinks: optional Map<String, String>
  socialLinks: z.record(z.string(), z.string()).optional(),
  role: z.string().min(1, 'Vui lòng chọn vai trò'),
  status: z.string().min(1, 'Vui lòng chọn trạng thái'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
});

// ─── Tab 2: Avatar ────────────────────────────────────────────────────────────
const AVATAR_URL_PATTERN = /^https:\/\/[a-zA-Z0-9.\-/%_+]+\.(jpg|jpeg|png|gif|webp|svg)(\?[\w=&%.\\-]*)?$/;
export const avatarSchema = z.object({
  avatar_url: z.string()
    .max(2048, 'URL avatar không được vượt quá 2048 ký tự')
    .refine((val) => val === '' || AVATAR_URL_PATTERN.test(val), {
      message: 'Avatar phải là URL https:// hợp lệ với định dạng ảnh (jpg, jpeg, png, gif, webp, svg)'
    })
    .optional()
    .or(z.literal(''))
});

// ─── Tab 3: Đổi mật khẩu (khớp với ResetPasswordRequest backend) ─────────────
export const resetPasswordSchema = z.object({
  password: z.string()
    .min(1, 'Mật khẩu không được để trống')
    .min(8, 'Mật khẩu phải từ 8 đến 100 ký tự')
    .max(100, 'Mật khẩu phải từ 8 đến 100 ký tự')
    .regex(PASSWORD_PATTERN, PASSWORD_MESSAGE),
  newPassword: z.string()
    .min(1, 'Mật khẩu không được để trống')
    .min(8, 'Mật khẩu phải từ 8 đến 100 ký tự')
    .max(100, 'Mật khẩu phải từ 8 đến 100 ký tự')
    .regex(PASSWORD_PATTERN, PASSWORD_MESSAGE),
  confirmPassword: z.string()
    .min(1, 'Xác nhận mật khẩu không được để trống')
    .min(8, 'Mật khẩu phải từ 8 đến 100 ký tự')
    .max(100, 'Mật khẩu phải từ 8 đến 100 ký tự')
    .regex(PASSWORD_PATTERN, PASSWORD_MESSAGE),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Xác nhận mật khẩu mới không khớp',
  path: ['confirmPassword']
});

export type UserFormValues = z.infer<typeof userSchema>;
export type UserInfoValues = z.infer<typeof userInfoSchema>;
export type AvatarValues = z.infer<typeof avatarSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export const EMAIL_STRICT_PATTERN_EXPORT = EMAIL_STRICT_PATTERN;
