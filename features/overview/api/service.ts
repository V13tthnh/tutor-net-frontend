import { apiClient } from '@/lib/api-client';

export interface KpiMetrics {
  totalRevenue: number;
  totalClassRequests: number;
  matchRate: number;
  newTutors: number;
  pendingTutorsCount: number;
}

export interface TimeSeriesChartData {
  timePeriod: string;
  revenue: number;
  contractCount: number;
}

export interface TopSubjectData {
  categoryName: string;
  count: number;
}

export interface ActionableTutor {
  id: number;
  fullName: string;
  email: string;
  createdAt: string;
}

export interface ActionableContract {
  id: number;
  contractNumber: string;
  deadline: string;
  amount: number;
}

export interface ActionableReview {
  id: number;
  tutorName: string;
  rating: number;
  comment: string;
}

export interface RecentTransactionData {
  id: number;
  transactionCode: string;
  tutorName: string;
  contractNumber: string;
  amount: number;
  paymentMethod: string;
  status: string;
  paidAt: string;
}

export interface DashboardResponse {
  kpis: KpiMetrics;
  timeSeriesChart: TimeSeriesChartData[];
  topSubjects: TopSubjectData[];
  classStatus: TopSubjectData[];
  pendingTutors: ActionableTutor[];
  overdueContracts: ActionableContract[];
  negativeReviews: ActionableReview[];
  recentTransactions: RecentTransactionData[];
}

export async function getDashboardData(params: {
  fromDate?: string;
  toDate?: string;
  interval?: string;
}): Promise<{ success: boolean; data: DashboardResponse }> {
  const query = new URLSearchParams();
  if (params.fromDate) query.append('fromDate', params.fromDate);
  if (params.toDate) query.append('toDate', params.toDate);
  if (params.interval) query.append('interval', params.interval);

  return apiClient<{ success: boolean; data: DashboardResponse }>(
    `/admin/dashboard?${query.toString()}`
  );
}
