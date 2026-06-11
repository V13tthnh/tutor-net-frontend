import { queryOptions } from '@tanstack/react-query';
import { getSubjectList, getSubjectStats, getSubjectTree } from './service';
import type { Subject, SubjectListFilters, SubjectTreeFilters } from './types';

export type { Subject };

export const subjectKeys = {
  all: ['subjects'] as const,
  list: (filters: SubjectListFilters) => [...subjectKeys.all, 'list', filters] as const,
  tree: (filters?: SubjectTreeFilters) => [...subjectKeys.all, 'tree', filters] as const,
  detail: (id: number) => [...subjectKeys.all, 'detail', id] as const,
  stats: () => [...subjectKeys.all, 'stats'] as const
};

/**
 * Query cho GET /admin/subjects?keyword=&isActive=
 * Trả về flat list Subject[].
 */
export const subjectsQueryOptions = (filters: SubjectListFilters = {}) =>
  queryOptions({
    queryKey: subjectKeys.list(filters),
    queryFn: () => getSubjectList(filters)
  });

export const subjectTreeQueryOptions = (filters?: SubjectTreeFilters) =>
  queryOptions({
    queryKey: subjectKeys.tree(filters),
    queryFn: () => getSubjectTree(filters?.search)
  });

export const subjectStatsQueryOptions = () =>
  queryOptions({
    queryKey: subjectKeys.stats(),
    queryFn: () => getSubjectStats()
  });
