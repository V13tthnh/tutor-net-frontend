import { queryOptions } from '@tanstack/react-query';
import { getDashboardData } from './service';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  detail: (filters: { fromDate?: string; toDate?: string; interval?: string }) =>
    [...dashboardKeys.all, filters] as const,
};

export const dashboardQueryOptions = (filters: {
  fromDate?: string;
  toDate?: string;
  interval?: string;
}) =>
  queryOptions({
    queryKey: dashboardKeys.detail(filters),
    queryFn: () => getDashboardData(filters).then((res) => res.data),
  });
