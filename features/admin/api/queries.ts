import { queryOptions } from '@tanstack/react-query';
import { getUsers, getUserStats, getUserById, getUserFilterOptions, getUserStatuses, getAdminTutors, getAdminTutorStats, getAdminTutorFilterOptions, getAdminTutorStatuses, getAdminTutorById, getAdminClassRequests, getAdminClassRequestDetail, getClassRequestFilterOptions, getAdminTutorInvitations, getAdminApplicationsForClass, getAdminContracts } from './service';
import type { User, UserFilters, AdminTutorFilters, ClassRequestFilters, TutorInvitationFilters, AdminContractFilters } from './types';

export type { User };

export const userKeys = {
  all: ['users'] as const,
  list: (filters: UserFilters) => [...userKeys.all, 'list', filters] as const,
  detail: (id: number) => [...userKeys.all, 'detail', id] as const,
  stats: () => [...userKeys.all, 'stats'] as const
};

export const usersQueryOptions = (filters: UserFilters) =>
  queryOptions({
    queryKey: userKeys.list(filters),
    queryFn: () => getUsers(filters)
  });

export const userStatsQueryOptions = () =>
  queryOptions({
    queryKey: userKeys.stats(),
    queryFn: () => getUserStats()
  });

export const userByIdOptions = (id: number) =>
  queryOptions({
    queryKey: userKeys.detail(id),
    queryFn: () => getUserById(id)
  });

export const userFilterOptionsQueryOptions = () =>
  queryOptions({
    queryKey: [...userKeys.all, 'filter-options'] as const,
    queryFn: () => getUserFilterOptions()
  });

export const userStatusesQueryOptions = () =>
  queryOptions({
    queryKey: [...userKeys.all, 'statuses'] as const,
    queryFn: () => getUserStatuses()
  });

export const adminTutorKeys = {
  all: ['admin-tutors'] as const,
  list: (filters: AdminTutorFilters) => [...adminTutorKeys.all, 'list', filters] as const,
  stats: () => [...adminTutorKeys.all, 'stats'] as const,
  filterOptions: () => [...adminTutorKeys.all, 'filter-options'] as const,
  statuses: () => [...adminTutorKeys.all, 'statuses'] as const,
  detail: (id: number) => [...adminTutorKeys.all, 'detail', id] as const,
};

export const adminTutorsQueryOptions = (filters: AdminTutorFilters) =>
  queryOptions({
    queryKey: adminTutorKeys.list(filters),
    queryFn: () => getAdminTutors(filters)
  });

export const adminTutorStatsQueryOptions = () =>
  queryOptions({
    queryKey: adminTutorKeys.stats(),
    queryFn: () => getAdminTutorStats()
  });

export const adminTutorFilterOptionsQueryOptions = () =>
  queryOptions({
    queryKey: adminTutorKeys.filterOptions(),
    queryFn: () => getAdminTutorFilterOptions()
  });

export const adminTutorStatusesQueryOptions = () =>
  queryOptions({
    queryKey: adminTutorKeys.statuses(),
    queryFn: () => getAdminTutorStatuses()
  });

export const adminTutorByIdOptions = (id: number) =>
  queryOptions({
    queryKey: adminTutorKeys.detail(id),
    queryFn: () => getAdminTutorById(id),
    enabled: !!id
  });

export const classRequestKeys = {
  all: ['admin-class-requests'] as const,
  list: (filters: ClassRequestFilters) => [...classRequestKeys.all, 'list', filters] as const,
  detail: (id: number) => [...classRequestKeys.all, 'detail', id] as const,
  filterOptions: () => [...classRequestKeys.all, 'filter-options'] as const,
};

export const adminClassRequestsQueryOptions = (filters: ClassRequestFilters) =>
  queryOptions({
    queryKey: classRequestKeys.list(filters),
    queryFn: () => getAdminClassRequests(filters)
  });

export const adminClassRequestDetailOptions = (id: number) =>
  queryOptions({
    queryKey: classRequestKeys.detail(id),
    queryFn: () => getAdminClassRequestDetail(id),
    enabled: !!id
  });

export const adminClassApplicationsQueryOptions = (classRequestId: number) =>
  queryOptions({
    queryKey: [...classRequestKeys.all, classRequestId, 'applications'],
    queryFn: () => getAdminApplicationsForClass(classRequestId),
    enabled: !!classRequestId
  });

export const classRequestFilterOptionsQueryOptions = () =>
  queryOptions({
    queryKey: classRequestKeys.filterOptions(),
    queryFn: () => getClassRequestFilterOptions()
  });

export const tutorInvitationKeys = {
  all: ['admin-tutor-invitations'] as const,
  list: (filters: TutorInvitationFilters) => [...tutorInvitationKeys.all, 'list', filters] as const,
};

export const adminTutorInvitationsQueryOptions = (filters: TutorInvitationFilters) =>
  queryOptions({
    queryKey: tutorInvitationKeys.list(filters),
    queryFn: () => getAdminTutorInvitations(filters)
  });

export const adminContractKeys = {
  all: ['admin-contracts'] as const,
  list: (filters: AdminContractFilters) => [...adminContractKeys.all, 'list', filters] as const,
};

export const adminContractsQueryOptions = (filters: AdminContractFilters) =>
  queryOptions({
    queryKey: adminContractKeys.list(filters),
    queryFn: () => getAdminContracts(filters)
  });

// ─── Transaction Management Query Options ──────────────────────────────────────

import { getTransactions, getTransactionSummary, getTransactionById } from './service';
import type { TransactionFilters } from './types';

export const adminTransactionKeys = {
  all: ['admin-transactions'] as const,
  list: (filters: TransactionFilters) => [...adminTransactionKeys.all, 'list', filters] as const,
  summary: (filters: TransactionFilters) => [...adminTransactionKeys.all, 'summary', filters] as const,
  detail: (id: number) => [...adminTransactionKeys.all, 'detail', id] as const,
};

export const adminTransactionsQueryOptions = (filters: TransactionFilters) =>
  queryOptions({
    queryKey: adminTransactionKeys.list(filters),
    queryFn: () => getTransactions(filters)
  });

export const adminTransactionSummaryQueryOptions = (filters: TransactionFilters) =>
  queryOptions({
    queryKey: adminTransactionKeys.summary(filters),
    queryFn: () => getTransactionSummary(filters).then((res) => res.data)
  });

export const adminTransactionByIdOptions = (id: number) =>
  queryOptions({
    queryKey: adminTransactionKeys.detail(id),
    queryFn: () => getTransactionById(id).then((res) => res.data),
    enabled: !!id
  });

