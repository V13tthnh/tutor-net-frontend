import { apiClient } from '@/lib/api-client';
import type { ClassFilters, ClassRequestsResponse } from './types';

export async function getClassRequests(filters: ClassFilters): Promise<ClassRequestsResponse> {
  const params = new URLSearchParams();

  if (filters.page) {
    params.append('page', String(filters.page));
  }
  if (filters.limit) {
    params.append('size', String(filters.limit));
  }
  if (filters.subjectId) {
    params.append('subjectId', String(filters.subjectId));
  }
  if (filters.teachingMode) {
    params.append('teachingMode', filters.teachingMode);
  }
  if (filters.sortBy) {
    params.append('sortBy', filters.sortBy);
  }
  if (filters.sortDir) {
    params.append('sortDir', filters.sortDir);
  }

  return apiClient<ClassRequestsResponse>(`/class-requests?${params.toString()}`);
}
