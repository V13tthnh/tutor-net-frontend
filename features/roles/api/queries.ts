import { queryOptions } from '@tanstack/react-query';
import { getRoles, getRoleById, getGroupedPermissions } from './service';
import type { RoleFilters } from './types';

export const roleKeys = {
  all: ['roles'] as const,
  list: (filters: RoleFilters) => [...roleKeys.all, 'list', filters] as const,
  detail: (id: number) => [...roleKeys.all, 'detail', id] as const,
  groupedPermissions: () => [...roleKeys.all, 'groupedPermissions'] as const
};

export const rolesQueryOptions = (filters: RoleFilters) =>
  queryOptions({
    queryKey: roleKeys.list(filters),
    queryFn: () => getRoles(filters)
  });

export const roleByIdOptions = (id: number) =>
  queryOptions({
    queryKey: roleKeys.detail(id),
    queryFn: () => getRoleById(id)
  });

export const groupedPermissionsQueryOptions = () =>
  queryOptions({
    queryKey: roleKeys.groupedPermissions(),
    queryFn: () => getGroupedPermissions()
  });
