
// ─── Frontend types (dùng trong UI) ──────────────────────────────────────────
export type Role = {
  id: number;
  name: string;
  slug: string;
  description: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
  is_system?: boolean;
  user_count?: number;
};



export type RoleFilters = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
};

export type RolesResponse = {
  success: boolean;
  time: string;
  message: string;
  total_items: number;
  offset: number;
  limit: number;
  items: Role[];
};

export type RoleMutationPayload = {
  name: string;
  slug: string;
  description: string;
  permissions: number[];
};

export type GroupedPermission = {
  module: string;
  permissions: Array<{
    id: number;
    name: string;
    slug: string;
    module: string;
    action: string;
    description?: string;
  }>;
};

export type RoleResponse = {
  success: boolean;
  message?: string;
  role?: Role;
};

// ─── Backend types (khớp với response thực từ API) ────────────────────────────
export type BackendRole = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  isSystem?: boolean;
  createdAt?: string;
  updatedAt?: string;
  permissions?: Array<{
    id: number;
    name: string;
    slug: string;
    module?: string;
    action?: string;
  }>;
  userCount?: number;
};

export type BackendRolesResponse = {
  success: boolean;
  message?: string;
  data?: {
    content: BackendRole[];
    totalElements: number;
    page: number;
    size: number;
  };
  // Flat list format (nếu backend trả về trực tiếp)
  items?: BackendRole[];
  totalElements?: number;
};


