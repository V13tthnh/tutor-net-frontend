import { apiClient } from '@/lib/api-client';
import type {
  ClassFilters,
  ClassRequestsResponse,
  ClassRequestOwnResponse,
  ClassApplicationResponse,
  PageResponse,
  ClassRequestOwnFilters,
} from './types';

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

export async function applyForClassRequest(
  classRequestId: number,
  message?: string
): Promise<{ success: boolean; message: string; data: unknown }> {
  return apiClient<{ success: boolean; message: string; data: unknown }>(
    `/class-requests/${classRequestId}/applications`,
    {
      method: 'POST',
      body: JSON.stringify({ message }),
    }
  );
}

export async function getMyClassRequests(
  filters: ClassRequestOwnFilters = {}
): Promise<{ success: boolean; data: PageResponse<ClassRequestOwnResponse> }> {
  const params = new URLSearchParams();

  if (filters.page) {
    params.append('page', String(filters.page));
  }
  if (filters.limit) {
    params.append('size', String(filters.limit));
  }
  if (filters.keyword) {
    params.append('keyword', filters.keyword);
  }
  if (filters.status) {
    params.append('status', filters.status);
  }
  if (filters.sortBy) {
    params.append('sortBy', filters.sortBy);
  } else {
    params.append('sortBy', 'createdAt');
  }
  if (filters.sortDir) {
    params.append('sortDir', filters.sortDir);
  } else {
    params.append('sortDir', 'desc');
  }

  return apiClient<{ success: boolean; data: PageResponse<ClassRequestOwnResponse> }>(
    `/class-requests/my-classes?${params.toString()}`
  );
}

export async function getApplicationsForClass(
  classRequestId: number
): Promise<{ success: boolean; data: ClassApplicationResponse[] }> {
  return apiClient<{ success: boolean; data: ClassApplicationResponse[] }>(
    `/class-requests/${classRequestId}/applications`
  );
}

export async function acceptApplication(
  classRequestId: number,
  applicationId: number
): Promise<{ success: boolean; message: string; data: ClassApplicationResponse }> {
  return apiClient<{ success: boolean; message: string; data: ClassApplicationResponse }>(
    `/class-requests/${classRequestId}/applications/${applicationId}/accept`,
    {
      method: 'POST',
    }
  );
}

