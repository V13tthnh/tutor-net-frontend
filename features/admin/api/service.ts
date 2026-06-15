import { apiClient } from '@/lib/api-client';
import type { User, UserFilters, UsersResponse, CreateUserPayload, UpdateUserPayload, UserStatsResponse, BackendUsersResponse, BackendUser, ResetPasswordPayload, UserFilterOptionsResponse, UserStatusOption, AdminTutorFilters, BackendTutorsResponse, AdminTutorStats, AdminTutorFilterOptions, AdminTutorStatusOption, AdminTutorDetail } from './types';
import { getAvatarUrl } from '@/lib/utils';

// ─── Helper: map backend status to display format ────────────────────────────
function mapStatus(status: string): string {
  if (status === 'ACTIVE') return 'Active';
  if (status === 'INACTIVE') return 'Inactive';
  if (status === 'SUSPENDED') return 'Suspended';
  if (status === 'PENDING_VERIFICATION') return 'Pending_verification';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

// ─── Helper: map BackendUser to User ─────────────────────────────────────────
function mapBackendUser(backendUser: BackendUser): User {
  return {
    id: backendUser.id,
    first_name: backendUser.fullName,
    last_name: '',
    email: backendUser.email,
    phone: backendUser.phone || '',
    status: mapStatus(backendUser.status),
    role: backendUser.roles?.[0]?.role?.slug || backendUser.roles?.[0]?.slug || 'user',
    // Normalize avatar_url: backend may return relative path or full URL with double /uploads/
    avatar_url: getAvatarUrl(backendUser.avatarUrl) ?? null,
    province: backendUser.province ?? '',
    ward: backendUser.ward ?? '',
    address: backendUser.address ?? '',
    socialLinks: backendUser.socialLinks ?? {},
    gender: backendUser.gender ?? 'OTHER',
    created_at: backendUser.createdAt,
    updated_at: backendUser.createdAt
  };
}

// ─── Get users list ───────────────────────────────────────────────────────────
export async function getUsers(filters: UserFilters): Promise<UsersResponse> {
  const params = new URLSearchParams();
  if (filters.page !== undefined) params.append('page', String(filters.page));
  if (filters.limit !== undefined) params.append('size', String(filters.limit));
  if (filters.search !== undefined) params.append('keyword', filters.search);

  // 1. Handle multiple status parameters (ACTIVE, INACTIVE, SUSPENDED, PENDING_VERIFICATION)
  if (filters.status) {
    const statusArray = Array.isArray(filters.status)
      ? filters.status
      : filters.status.split(',');
    const statuses = statusArray.map((s) => {
      const val = s.trim().toUpperCase();
      if (val === 'ACTIVE') return 'ACTIVE';
      if (val === 'INACTIVE') return 'INACTIVE';
      if (val === 'SUSPENDED') return 'SUSPENDED';
      if (val === 'PENDING_VERIFICATION') return 'PENDING_VERIFICATION';
      return val;
    });
    statuses.forEach((status) => {
      params.append('status', status);
    });
  }

  // 2. Handle multiple roles parameters (admin, super_admin)
  if (filters.roles) {
    const rolesArray = Array.isArray(filters.roles)
      ? filters.roles
      : filters.roles.split(',');
    const roles = rolesArray.map((r) => r.trim());
    roles.forEach((role) => {
      params.append('roles', role);
    });
  }

  // 3. Handle sortBy and sortDir
  let sortBy = 'id';
  let sortDir = 'desc';
  if (filters.sort) {
    try {
      const sortState = JSON.parse(filters.sort);
      if (Array.isArray(sortState) && sortState.length > 0) {
        const sortItem = sortState[0];
        let field = sortItem.id;
        if (field === 'keyword') {
          field = 'fullName';
        }
        sortBy = field;
        sortDir = sortItem.desc ? 'desc' : 'asc';
      }
    } catch (e) {
      console.error('Failed to parse sort state:', e);
    }
  }
  params.append('sortBy', sortBy);
  params.append('sortDir', sortDir);

  const res = await apiClient<BackendUsersResponse>(`/admin/users?${params.toString()}`, {
    cache: 'no-store'
  });

  if (!res.success) {
    throw new Error(res.message || 'Lỗi lấy danh sách người dùng từ API');
  }

  const { content, totalElements, page, size } = res.data;

  return {
    success: true,
    time: new Date().toISOString(),
    message: res.message || 'Thành công',
    total_users: totalElements,
    offset: page * size,
    limit: size,
    users: content.map(mapBackendUser)
  };
}

// ─── Get user stats ───────────────────────────────────────────────────────────
export async function getUserStats(): Promise<UserStatsResponse> {
  // Lấy tổng số users từ API (page=1, size=1 để lấy totalElements)
  const res = await apiClient<BackendUsersResponse>(`/admin/users?page=1&size=1`, {
    cache: 'no-store'
  });

  if (!res.success) {
    throw new Error(res.message || 'Lỗi lấy thống kê người dùng');
  }

  const totalUsers = res.data.totalElements;

  // Lấy số active users
  const activeRes = await apiClient<BackendUsersResponse>(`/admin/users?page=1&size=1&status=ACTIVE`, {
    cache: 'no-store'
  });
  const activeUsers = activeRes.success ? activeRes.data.totalElements : 0;

  // Lấy số inactive users
  const inactiveRes = await apiClient<BackendUsersResponse>(`/admin/users?page=1&size=1&status=INACTIVE`, {
    cache: 'no-store'
  });
  const inactiveUsers = inactiveRes.success ? inactiveRes.data.totalElements : 0;

  return {
    success: true,
    totalUsers,
    activeUsers,
    inactiveUsers
  };
}

// ─── Get user by ID ───────────────────────────────────────────────────────────
export async function getUserById(id: number): Promise<{ success: boolean; user?: User; message?: string }> {
  const res = await apiClient<{ success: boolean; data: BackendUser; message?: string }>(`/admin/users/${id}`);

  if (!res.success || !res.data) {
    throw new Error(res.message || 'Không thể lấy thông tin người dùng từ API');
  }

  return {
    success: true,
    user: mapBackendUser(res.data)
  };
}

// ─── Role management helpers ──────────────────────────────────────────────────
export async function assignRole(userId: number, roleId: number) {
  return apiClient<{ success: boolean; message?: string }>(`/admin/users/${userId}/roles`, {
    method: 'POST',
    body: JSON.stringify({ roleId })
  });
}

export async function revokeRole(userId: number, roleId: number) {
  return apiClient<{ success: boolean; message?: string }>(`/admin/users/${userId}/roles/${roleId}`, {
    method: 'DELETE'
  });
}

export async function resetPassword(userId: number, data: ResetPasswordPayload) {
  return apiClient<{ success: boolean; message?: string }>(`/admin/users/${userId}/reset-password`, {
    method: 'PATCH',
    body: JSON.stringify({
      password: data.password,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword
    })
  });
}

export async function updateUserStatus(userId: number, status: string) {
  const backendStatus = status.toUpperCase();
  return apiClient<{ success: boolean; message?: string }>(`/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: backendStatus })
  });
}

// ─── Create user (maps to CreateAdminRequest) ────────────────────────────────
export async function createUser(data: CreateUserPayload) {
  // Resolve role ID from slug
  let roleId = data.role === 'super_admin' ? 1 : 2;
  try {
    const rolesRes = await apiClient<any>('/admin/roles');
    let rolesList: any[] = [];
    if (rolesRes.success) {
      if (rolesRes.data) {
        if (Array.isArray(rolesRes.data.content)) {
          rolesList = rolesRes.data.content;
        } else if (Array.isArray(rolesRes.data)) {
          rolesList = rolesRes.data;
        }
      } else if (Array.isArray(rolesRes.items)) {
        rolesList = rolesRes.items;
      }
    }
    const matched = rolesList.find((r: any) => r.slug === data.role);
    if (matched) {
      roleId = matched.id;
    }
  } catch (e) {
    console.warn('Failed to fetch roles for role ID resolution, using fallback IDs:', e);
  }

  // Đồng bộ với CreateAdminRequest:
  //   fullName, email, phone (optional), password, confirmPassword, status, roleIds
  const res = await apiClient<{ success: boolean; data: { id: number }; message?: string }>('/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      fullName: data.first_name,
      email: data.email,
      phone: data.phone || '',
      password: data.password,
      confirmPassword: data.confirm_password,
      status: data.status.toUpperCase(),
      roleIds: [roleId],
      gender: data.gender || 'OTHER'
    })
  });

  if (!res.success || !res.data?.id) {
    throw new Error(res.message || 'Lỗi tạo người dùng');
  }

  return { success: true, message: 'Tạo tài khoản quản trị viên thành công' };
}

// ─── Update user (maps to UpdateAdminRequest) ────────────────────────────────
export async function updateUser(id: number, data: UpdateUserPayload) {
  // Resolve role ID from slug
  let roleId = data.role === 'super_admin' ? 1 : data.role === 'admin' ? 2 : 4;
  try {
    const rolesRes = await apiClient<any>('/admin/roles');
    let rolesList: any[] = [];
    if (rolesRes.success) {
      if (rolesRes.data) {
        if (Array.isArray(rolesRes.data.content)) rolesList = rolesRes.data.content;
        else if (Array.isArray(rolesRes.data)) rolesList = rolesRes.data;
      } else if (Array.isArray(rolesRes.items)) {
        rolesList = rolesRes.items;
      }
    }
    const matched = rolesList.find((r: any) => r.slug === data.role);
    if (matched) {
      roleId = matched.id;
    }
  } catch (e) {
    console.warn('Failed to fetch roles for role ID resolution, using fallback IDs:', e);
  }

  // Đồng bộ với UpdateAdminRequest:
  //   fullName, email, phone, province, ward, address, socialLinks,
  //   password (optional), confirmPassword (optional), status, roleIds, gender
  const body: Record<string, any> = {
    fullName: data.first_name,
    email: data.email,
    phone: data.phone || '',
    province: data.province,
    ward: data.ward,
    address: data.address,
    socialLinks: data.socialLinks || {},
    status: data.status.toUpperCase(),
    roleIds: [roleId],
    avatarUrl: data.avatar_url ?? '',
    gender: data.gender || 'OTHER'
  };

  // Chỉ gửi password/confirmPassword nếu người dùng muốn đổi mật khẩu
  if (data.password && data.password.trim().length > 0) {
    body.password = data.password;
    body.confirmPassword = data.confirm_password || '';
  }

  const res = await apiClient<{ success: boolean; message?: string }>(`/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });

  if (!res.success) {
    throw new Error(res.message || 'Lỗi cập nhật thông tin người dùng');
  }

  return { success: true, message: 'Cập nhật thông tin tài khoản thành công' };
}

// ─── Update avatar only ───────────────────────────────────────────────────────
export async function updateAvatar(id: number, fileOrUrl: File | string) {
  let res;
  if (fileOrUrl instanceof File) {
    const formData = new FormData();
    formData.append('file', fileOrUrl);

    res = await apiClient<{ success: boolean; message?: string }>(`/admin/users/${id}/avatar`, {
      method: 'PATCH',
      body: formData
    });
  } else {
    res = await apiClient<{ success: boolean; message?: string }>(`/admin/users/${id}/avatar`, {
      method: 'PATCH',
      body: JSON.stringify({ avatarUrl: fileOrUrl })
    });
  }

  if (!res.success) {
    throw new Error(res.message || 'Lỗi cập nhật ảnh đại diện');
  }

  return { success: true, message: 'Cập nhật ảnh đại diện thành công' };
}

// ─── Delete user ──────────────────────────────────────────────────────────────
export async function deleteUser(id: number) {
  return apiClient<{ success: boolean; message?: string }>(`/admin/users/${id}`, {
    method: 'DELETE'
  });
}

// ─── Get user filter options ──────────────────────────────────────────────────
export async function getUserFilterOptions(): Promise<UserFilterOptionsResponse['data']> {
  const res = await apiClient<UserFilterOptionsResponse>('/admin/users/filter-options', {
    cache: 'no-store'
  });

  if (!res.success || !res.data) {
    throw new Error(res.message || 'Lỗi lấy danh sách filter options từ API');
  }

  return res.data;
}

// ─── Get user statuses ────────────────────────────────────────────────────────
export async function getUserStatuses(): Promise<UserStatusOption[]> {
  const res = await apiClient<UserStatusOption[]>('/admin/users/statuses', {
    cache: 'no-store'
  });
  return res;
}

// ─── Get admin tutors list ───────────────────────────────────────────────────
export async function getAdminTutors(filters: AdminTutorFilters): Promise<BackendTutorsResponse> {
  const params = new URLSearchParams();
  if (filters.page !== undefined) params.append('page', String(filters.page));
  if (filters.limit !== undefined) {
    params.append('size', String(filters.limit));
    params.append('limit', String(filters.limit));
  }
  if (filters.keyword !== undefined) params.append('keyword', filters.keyword);

  if (filters.statuses && filters.statuses.length > 0) {
    filters.statuses.forEach(status => {
      // Map 'PENDING' UI status to 'PENDING_REVIEW' for backend
      const backendStatus = status === 'PENDING' ? 'PENDING_REVIEW' : status;
      params.append('statuses', backendStatus);
    });
  }

  if (filters.subjectIds && filters.subjectIds.length > 0) {
    filters.subjectIds.forEach(id => {
      params.append('subjectIds', String(id));
    });
  }

  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortDir) params.append('sortDir', filters.sortDir);

  const res = await apiClient<BackendTutorsResponse>(`/admin/tutors?${params.toString()}`, {
    cache: 'no-store'
  });

  if (!res.success) {
    throw new Error(res.message || 'Lỗi lấy danh sách gia sư từ API');
  }

  return res;
}

// ─── Approve tutor profile ───────────────────────────────────────────────────
export async function approveTutorProfile(id: number) {
  const res = await apiClient<{ success: boolean; message?: string }>(`/admin/tutors/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ status: 'APPROVED' })
  });
  if (!res.success) {
    throw new Error(res.message || 'Lỗi khi phê duyệt hồ sơ gia sư');
  }
  return res;
}

// ─── Reject tutor profile ────────────────────────────────────────────────────
export async function rejectTutorProfile(id: number, reason: string) {
  const res = await apiClient<{ success: boolean; message?: string }>(`/admin/tutors/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ status: 'REJECTED', rejectionReason: reason })
  });
  if (!res.success) {
    throw new Error(res.message || 'Lỗi khi từ chối hồ sơ gia sư');
  }
  return res;
}

// ─── Get admin tutor stats ───────────────────────────────────────────────────
export async function getAdminTutorStats(): Promise<AdminTutorStats> {
  const res = await apiClient<any>('/admin/tutors/stats', {
    cache: 'no-store'
  });
  if (res && res.data !== undefined) {
    return res.data;
  }
  return res;
}

// ─── Get admin tutor filter options ──────────────────────────────────────────
export async function getAdminTutorFilterOptions(): Promise<AdminTutorFilterOptions> {
  const res = await apiClient<any>('/admin/tutors/filter-options', {
    cache: 'no-store'
  });
  if (res && res.data !== undefined) {
    return res.data;
  }
  return res;
}

// ─── Get admin tutor statuses ────────────────────────────────────────────────
export async function getAdminTutorStatuses(): Promise<AdminTutorStatusOption[]> {
  const res = await apiClient<any>('/admin/tutors/statuses', {
    cache: 'no-store'
  });
  if (res && res.data !== undefined) {
    return res.data;
  }
  return res;
}

// ─── Get admin tutor by ID ───────────────────────────────────────────────────
export async function getAdminTutorById(id: number): Promise<AdminTutorDetail> {
  const res = await apiClient<any>(`/admin/tutors/${id}`, {
    cache: 'no-store'
  });
  if (res && res.data !== undefined) {
    return res.data;
  }
  return res;
}

// ──── Class Request Management ───────────────────────────────────────────

import type { ClassRequestFilters, ClassRequestsPageResponse, ClassRequestResponse, ReviewClassRequest, ClassRequestFilterOptions } from './types';

// ─── Get class requests list ────────────────────────────────────────────
export async function getAdminClassRequests(filters: ClassRequestFilters): Promise<ClassRequestsPageResponse> {
  const params = new URLSearchParams();
  if (filters.page !== undefined) params.append('page', String(filters.page));
  if (filters.limit !== undefined) params.append('size', String(filters.limit));
  if (filters.keyword !== undefined) params.append('keyword', filters.keyword);
  if (filters.status !== undefined) params.append('status', filters.status);
  if (filters.subjectId !== undefined) params.append('subjectId', String(filters.subjectId));
  if (filters.teachingMode !== undefined) params.append('teachingMode', filters.teachingMode);
  if (filters.sortBy !== undefined) params.append('sortBy', filters.sortBy);
  if (filters.sortDir !== undefined) params.append('sortDir', filters.sortDir);

  const res = await apiClient<ClassRequestsPageResponse>(`/admin/class-requests?${params.toString()}`, {
    cache: 'no-store'
  });

  if (!res.success) {
    throw new Error(res.message || 'Lỗi lấy danh sách yêu cầu lớp học từ API');
  }

  return res;
}

// ─── Get class request detail ───────────────────────────────────────────
export async function getAdminClassRequestDetail(id: number): Promise<ClassRequestResponse> {
  const res = await apiClient<{ success: boolean; data: ClassRequestResponse; message?: string }>(`/admin/class-requests/${id}`, {
    cache: 'no-store'
  });

  if (!res.success || !res.data) {
    throw new Error(res.message || 'Lỗi lấy chi tiết yêu cầu lớp học');
  }

  return res.data;
}

// ─── Approve/Reject class request ───────────────────────────────────────
export async function reviewClassRequest(id: number, reviewData: ReviewClassRequest) {
  const res = await apiClient<{ success: boolean; data: ClassRequestResponse; message?: string }>(`/admin/class-requests/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify(reviewData)
  });

  if (!res.success) {
    throw new Error(res.message || 'Lỗi xử lý yêu cầu lớp học');
  }

  return res;
}

// ─── Get class request filter options ───────────────────────────────────
export async function getClassRequestFilterOptions(): Promise<ClassRequestFilterOptions> {
  const res = await apiClient<{ success: boolean; data: ClassRequestFilterOptions; message?: string }>('/admin/class-requests/filter-options', {
    cache: 'no-store'
  });

  if (!res.success || !res.data) {
    throw new Error(res.message || 'Lỗi lấy danh sách filter options');
  }

  return res.data;
}

// ─── Bulk review class requests ─────────────────────────────────────
export async function bulkReviewClassRequests(classRequestIds: number[], reviewData: ReviewClassRequest) {
  const bulkRequest = {
    classRequestIds,
    status: reviewData.status,
    rejectionReason: reviewData.rejectionReason,
  };

  const res = await apiClient<{ success: boolean; data: ClassRequestResponse[]; message?: string }>(`/admin/class-requests/bulk-review`, {
    method: 'PATCH',
    body: JSON.stringify(bulkRequest)
  });

  if (!res.success) {
    throw new Error(res.message || 'Lỗi xử lý hàng loạt yêu cầu lớp học');
  }

  return res;
}

// ──── Tutor Invitation Management ──────────────────────────────────────────

import type { TutorInvitationFilters, TutorInvitationsPageResponse, AdminCancelInvitationRequest } from './types';

// ─── Get tutor invitations list ────────────────────────────────────────
export async function getAdminTutorInvitations(filters: TutorInvitationFilters): Promise<TutorInvitationsPageResponse> {
  const params = new URLSearchParams();
  if (filters.page !== undefined) params.append('page', String(filters.page));
  if (filters.limit !== undefined) params.append('size', String(filters.limit));
  if (filters.keyword) params.append('keyword', filters.keyword);
  if (filters.status) params.append('status', filters.status);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortDir) params.append('sortDir', filters.sortDir);

  const res = await apiClient<TutorInvitationsPageResponse>(`/admin/tutor-invitations?${params.toString()}`, {
    cache: 'no-store'
  });

  if (!res.success) {
    throw new Error(res.message || 'Lỗi lấy danh sách lời mời từ API');
  }

  return res;
}

// ─── Force cancel tutor invitation ────────────────────────────────────
export async function forceCancelTutorInvitation(id: number, data: AdminCancelInvitationRequest) {
  const res = await apiClient<{ success: boolean; message?: string }>(`/admin/tutor-invitations/${id}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });

  if (!res.success) {
    throw new Error(res.message || 'Lỗi hủy lời mời');
  }

  return res;
}
