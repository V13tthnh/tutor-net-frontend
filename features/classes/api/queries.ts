import { queryOptions } from '@tanstack/react-query';
import { getClassRequests } from './service';
import type { ClassFilters } from './types';

export const classKeys = {
  all: ['classes'] as const,
  list: (filters: ClassFilters) => [...classKeys.all, 'list', filters] as const
};

export const classRequestsQueryOptions = (filters: ClassFilters) =>
  queryOptions({
    queryKey: classKeys.list(filters),
    queryFn: () => getClassRequests(filters)
  });
