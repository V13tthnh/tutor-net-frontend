import { apiClient } from '@/lib/api-client';
import type {
  Role,
  RoleFilters,
  RolesResponse,
  RoleMutationPayload,
  RoleResponse,
  BackendRole,
  BackendRolesResponse,
  GroupedPermission
} from './types';

// ─── Helper: map BackendRole → Role (frontend) ────────────────────────────────
function mapBackendRole(r: BackendRole): Role {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description || '',
    permissions: r.permissions?.map((p) => p.slug) ?? [],
    created_at: r.createdAt || new Date().toISOString(),
    updated_at: r.updatedAt || new Date().toISOString(),
    is_system: r.isSystem,
    user_count: r.userCount
  };
}

// ─── Get roles list ───────────────────────────────────────────────────────────
export async function getRoles(filters: RoleFilters): Promise<RolesResponse> {
  const res = await apiClient<any>('/admin/roles', {
    cache: 'no-store'
  });

  // DEBUG: in toàn bộ response để xác định cấu trúc thực tế từ backend
  // console.log('[DEBUG] GET /admin/roles raw response:', JSON.stringify(res, null, 2));

  if (!res.success) {
    throw new Error(res.message || 'Lỗi lấy danh sách roles từ API');
  }

  let roles: Role[] = [];

  if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
    if (Array.isArray(res.data.content)) {
      roles = res.data.content.map(mapBackendRole);
    } else {
      console.warn('[DEBUG] Unexpected data shape in /admin/roles:', res.data);
    }
  } else if (Array.isArray(res.data)) {
    roles = (res.data as BackendRole[]).map(mapBackendRole);
  } else if (Array.isArray(res.items)) {
    roles = (res.items as BackendRole[]).map(mapBackendRole);
  }

  // 1. Handle in-memory keyword search
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    roles = roles.filter(
      (r) =>
        r.name.toLowerCase().includes(searchLower) ||
        r.description.toLowerCase().includes(searchLower) ||
        r.slug.toLowerCase().includes(searchLower)
    );
  }

  // 2. Handle in-memory sorting
  if (filters.sort) {
    try {
      const sortState = JSON.parse(filters.sort);
      if (Array.isArray(sortState) && sortState.length > 0) {
        const sortItem = sortState[0];
        let field = sortItem.id;
        if (field === 'keyword') {
          field = 'name';
        }
        const desc = sortItem.desc;
        roles.sort((a, b) => {
          let valA = a[field as keyof Role];
          let valB = b[field as keyof Role];

          if (valA === undefined || valA === null) return desc ? 1 : -1;
          if (valB === undefined || valB === null) return desc ? -1 : 1;

          if (field === 'permissions') {
            const countA = Array.isArray(valA) ? valA.length : 0;
            const countB = Array.isArray(valB) ? valB.length : 0;
            return desc ? countB - countA : countA - countB;
          }

          if (typeof valA === 'string' && typeof valB === 'string') {
            return desc
              ? valB.localeCompare(valA)
              : valA.localeCompare(valB);
          }
          if (typeof valA === 'number' && typeof valB === 'number') {
            return desc ? valB - valA : valA - valB;
          }
          return 0;
        });
      }
    } catch (e) {
      console.error('Failed to parse sort state for roles:', e);
    }
  }

  const totalItems = roles.length;

  // 3. Handle in-memory pagination
  const page = filters.page ?? 1;
  const size = filters.limit ?? 10;
  const offset = (page - 1) * size;
  roles = roles.slice(offset, offset + size);

  return {
    success: true,
    time: new Date().toISOString(),
    message: res.message || 'Thành công',
    total_items: totalItems,
    offset,
    limit: size,
    items: roles
  };
}

// ─── Get role by ID ───────────────────────────────────────────────────────────
export async function getRoleById(id: number): Promise<RoleResponse> {
  const res = await apiClient<{ success: boolean; data: BackendRole; message?: string }>(
    `/admin/roles/${id}`
  );

  if (!res.success || !res.data) {
    throw new Error(res.message || 'Không thể lấy thông tin role từ API');
  }

  return {
    success: true,
    role: mapBackendRole(res.data)
  };
}

// Helper to generate a URL/Spring Boot safe slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove Vietnamese diacritics
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s_]/g, '') // remove special characters except space/underscore
    .trim()
    .replace(/\s+/g, '_'); // replace spaces with underscores
};

// ─── Create role ──────────────────────────────────────────────────────────────
export async function createRole(data: RoleMutationPayload): Promise<RoleResponse> {
  const slug = data.slug || generateSlug(data.name);

  // 1. Create role
  const createRes = await apiClient<{ success: boolean; data: BackendRole; message?: string }>(
    '/admin/roles',
    {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        slug: slug,
        description: data.description
      })
    }
  );

  if (!createRes.success || !createRes.data) {
    throw new Error(createRes.message || 'Lỗi tạo role');
  }

  const roleId = createRes.data.id;

  // 2. Sync permissions
  const syncRes = await apiClient<{ success: boolean; data: BackendRole; message?: string }>(
    `/admin/roles/${roleId}/permissions/sync`,
    {
      method: 'PUT',
      body: JSON.stringify({
        permissionIds: data.permissions
      })
    }
  );

  if (!syncRes.success) {
    throw new Error(syncRes.message || 'Lỗi đồng bộ permissions cho role');
  }

  return {
    success: true,
    message: 'Tạo role thành công',
    role: syncRes.data ? mapBackendRole(syncRes.data) : undefined
  };
}

// ─── Update role ──────────────────────────────────────────────────────────────
export async function updateRole(id: number, data: RoleMutationPayload): Promise<RoleResponse> {
  // 1. Update role name and description
  const updateRes = await apiClient<{ success: boolean; data: BackendRole; message?: string }>(
    `/admin/roles/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        name: data.name,
        description: data.description
      })
    }
  );

  if (!updateRes.success) {
    throw new Error(updateRes.message || 'Lỗi cập nhật role');
  }

  // 2. Sync permissions
  const syncRes = await apiClient<{ success: boolean; data: BackendRole; message?: string }>(
    `/admin/roles/${id}/permissions/sync`,
    {
      method: 'PUT',
      body: JSON.stringify({
        permissionIds: data.permissions
      })
    }
  );

  if (!syncRes.success) {
    throw new Error(syncRes.message || 'Lỗi đồng bộ permissions cho role');
  }

  return {
    success: true,
    message: 'Cập nhật role thành công',
    role: syncRes.data ? mapBackendRole(syncRes.data) : undefined
  };
}

// ─── Get grouped permissions ──────────────────────────────────────────────────
export async function getGroupedPermissions(): Promise<GroupedPermission[]> {
  const res = await apiClient<{ success: boolean; data: GroupedPermission[]; message?: string }>(
    '/admin/permissions/grouped',
    {
      cache: 'no-store'
    }
  );

  if (!res.success || !res.data) {
    throw new Error(res.message || 'Lỗi lấy danh sách permissions được nhóm từ API');
  }

  return res.data;
}

// ─── Delete role ──────────────────────────────────────────────────────────────
export async function deleteRole(id: number): Promise<{ success: boolean; message: string }> {
  const res = await apiClient<{ success: boolean; message?: string }>(`/admin/roles/${id}`, {
    method: 'DELETE'
  });

  return {
    success: res.success,
    message: res.message || (res.success ? 'Xóa role thành công' : 'Lỗi xóa role')
  };
}
