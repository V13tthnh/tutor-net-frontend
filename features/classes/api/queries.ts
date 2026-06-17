import { queryOptions } from '@tanstack/react-query';
import { getClassRequests, getMyClassRequests, getApplicationsForClass } from './service';
import type { ClassFilters, ClassRequestOwnFilters } from './types';

export const classKeys = {
  all: ['classes'] as const,
  list: (filters: ClassFilters) => [...classKeys.all, 'list', filters] as const
};

export const classRequestsQueryOptions = (filters: ClassFilters) =>
  queryOptions({
    queryKey: classKeys.list(filters),
    queryFn: () => getClassRequests(filters)
  });

export const myClassRequestsQueryOptions = (filters: ClassRequestOwnFilters = {}) =>
  queryOptions({
    queryKey: [...classKeys.all, 'my-classes', filters],
    queryFn: () => getMyClassRequests(filters)
  });

export const classApplicationsQueryOptions = (classRequestId: number) =>
  queryOptions({
    queryKey: [...classKeys.all, classRequestId, 'applications'],
    queryFn: () => getApplicationsForClass(classRequestId)
  });

