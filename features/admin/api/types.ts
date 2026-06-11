export type GenderType = 'MALE' | 'FEMALE' | 'OTHER';

export const GENDER_OPTIONS: { value: GenderType; label: string }[] = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
];

export type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  role: string;
  avatar_url: string | null;
  province?: string;
  ward?: string;
  address?: string;
  socialLinks?: Record<string, string>;
  gender?: GenderType;
  created_at: string;
  updated_at: string;
};

export type ResetPasswordPayload = {
  password: string;       // current password
  newPassword: string;
  confirmPassword: string;
};

export type UserFilters = {
  page?: number;
  limit?: number;
  roles?: string | string[];
  status?: string | string[];
  search?: string;
  sort?: string;
};

export type UserStatsResponse = {
  success: boolean;
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
};

export type UsersResponse = {
  success: boolean;
  time: string;
  message: string;
  total_users: number;
  offset: number;
  limit: number;
  users: User[];
};

/** Payload cho CreateAdminRequest (tạo mới) */
export type CreateUserPayload = {
  first_name: string;           // → fullName
  email: string;
  phone?: string;               // optional, có thể rỗng
  password: string;             // bắt buộc khi tạo mới
  confirm_password: string;     // → confirmPassword
  status: string;               // → UserStatus (sẽ uppercase ở service)
  role: string;                 // slug, được resolve thành roleId ở service
  gender?: GenderType;          // → GenderType enum
};

/** Payload cho UpdateAdminRequest (cập nhật) */
export type UpdateUserPayload = {
  first_name: string;           // → fullName
  email: string;                // bắt buộc theo server
  phone?: string;               // optional
  province: string;             // bắt buộc theo server
  ward: string;                 // bắt buộc theo server
  address: string;              // bắt buộc theo server
  socialLinks?: Record<string, string>; // optional
  password?: string;            // optional - chỉ khi muốn đổi mật khẩu
  confirm_password?: string;    // → confirmPassword
  status: string;               // → UserStatus (sẽ uppercase ở service)
  role: string;                 // slug, được resolve thành roleId ở service
  avatar_url?: string | null;
  gender?: GenderType;          // → GenderType enum
};

/** @deprecated Dùng CreateUserPayload hoặc UpdateUserPayload thay thế */
export type UserMutationPayload = CreateUserPayload & Partial<UpdateUserPayload>;

export type BackendUser = {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  province?: string | null;
  ward?: string | null;
  address?: string | null;
  socialLinks?: Record<string, string> | null;
  gender?: GenderType | null;
  status: string;
  isVerified: boolean;
  createdAt: string;
  roles: Array<{
    id: number;
    name?: string;
    slug?: string;
    role?: {
      id: number;
      name: string;
      slug: string;
    };
  }>;
};

export type BackendUsersResponse = {
  success: boolean;
  message: string;
  data: {
    content: BackendUser[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
  };
  timestamp: string;
};

export type FilterStatusOption = {
  value: string;
  label: string;
};

export type FilterRoleOption = {
  id: number;
  slug: string;
  name: string;
};

export type UserFilterOptionsResponse = {
  success: boolean;
  message: string;
  data: {
    statuses: FilterStatusOption[];
    roles: FilterRoleOption[];
  };
  timestamp: string;
};

export type UserStatusOption = {
  value: string;
  label: string;
};

export type AdminTutorFilters = {
  page?: number;
  limit?: number;
  keyword?: string;
  statuses?: string[];
  subjectIds?: number[];
  sortBy?: string;
  sortDir?: string;
};

export type BackendTutorSummary = {
  id: number;
  userId: number;
  fullName: string;
  avatarUrl: string | null;
  email: string;
  phone: string | null;
  status: string;
  educationLevel: string;
  subjectNames: string[];
  experienceYears: number;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
};

export type BackendTutorsResponse = {
  success: boolean;
  message: string;
  data: {
    content: BackendTutorSummary[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
  };
  timestamp: string;
};

export type AdminTutorStats = {
  total: number;
  pendingReview: number;
  approved: number;
  rejected: number;
};

export type AdminTutorFilterStatus = {
  value: string;
  label: string;
};

export type AdminTutorFilterSubject = {
  id: number;
  name: string;
};

export type AdminTutorFilterOptions = {
  statuses: AdminTutorFilterStatus[];
  subjects: AdminTutorFilterSubject[];
};

export type AdminTutorStatusOption = {
  value: string;
  label: string;
};

export type AdminTutorDetailSubject = {
  id: number;
  subjectId: number;
  subjectName: string;
  proficiencyLevel: string;
  hourlyRate: number;
};

export type AdminTutorDetailCertificate = {
  id: number;
  name: string;
  fileUrl: string;
  isVerified: boolean;
};

export type AdminTutorDetailAvailability = {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type AdminTutorDetailTeachingArea = {
  id: number;
  province: string;
  ward: string;
};

export type AdminTutorDetail = {
  id: number;
  userId: number;
  fullName: string;
  avatarUrl: string | null;
  province: string;
  ward: string;
  address: string;
  hometownProvince: string;
  hometownWard: string;
  hometownAddress: string;
  headline: string;
  bio: string;
  experienceYears: number;
  educationLevel: string;
  isAvailable: boolean;
  teachingModes: string[];
  teachingMode?: string;
  teachingAreas: AdminTutorDetailTeachingArea[];
  status: string;
  ratingAvg: number;
  ratingCount: number;
  occupation: string;
  studentYear: number | null;
  major: string | null;
  university: string;
  graduationYear: number;
  achievements: string;
  idCardFrontUrl: string | null;
  idCardBackUrl: string | null;
  termsAcceptedAt: string | null;
  subjects: AdminTutorDetailSubject[];
  certificates: AdminTutorDetailCertificate[];
  availability: AdminTutorDetailAvailability[];
  createdAt: string;
  updatedAt: string;
};

// ──── Class Request Types ────────────────────────────────────────────────

export type ClassRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type TeachingMode = 'ONLINE' | 'OFFLINE' | 'HYBRID';

export type ClassRequestResponse = {
  id: number;
  studentName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  gradeLevel: string;
  subjectId: number;
  subjectName: string;
  proposedPrice: number;
  sessionsPerWeek: number;
  durationMinutes: number;
  teachingMode: TeachingMode;
  addressDetail?: string;
  studentNotes?: string;
  status: ClassRequestStatus;
  rejectionReason?: string;
  targetTutorId?: number;
  createdAt: string;
  updatedAt: string;
};

export type ClassRequestFilters = {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: string;
  subjectId?: number;
  teachingMode?: string;
  sortBy?: string;
  sortDir?: string;
};

export type ClassRequestsPageResponse = {
  success: boolean;
  message: string;
  data: {
    content: ClassRequestResponse[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
  };
  timestamp: string;
};

export type ReviewClassRequest = {
  status: ClassRequestStatus;
  rejectionReason?: string;
};

export type ClassRequestFilterOptions = {
  statuses: { value: string; label: string }[];
  subjects: { id: number; name: string }[];
  teachingModes: { value: string; label: string }[];
};
