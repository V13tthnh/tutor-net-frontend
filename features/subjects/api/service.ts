import { getMockSubjectStats } from '@/constants/mock-api-subjects';
import { apiClient } from '@/lib/api-client';
import type {
  SubjectListFilters,
  SubjectListResponse,
  SubjectStatsResponse,
  SubjectTreeResponse,
  CreateSubjectPayload,
  UpdateSubjectPayload,
  Subject
} from './types';

/**
 * GET /api/v1/admin/subjects/tree
 * Trả về danh sách môn học dạng cây (có children lồng nhau).
 */
export async function getSubjectTree(search?: string): Promise<SubjectTreeResponse> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiClient<SubjectTreeResponse>(`/admin/subjects/tree${qs}`);
}

/**
 * GET /api/v1/admin/subjects?keyword=&isActive=
 * Trả về flat list môn học, lọc theo từ khóa và trạng thái.
 */
export async function getSubjectList(filters: SubjectListFilters = {}): Promise<SubjectListResponse> {
  const params = new URLSearchParams();
  if (filters.keyword) params.set('keyword', filters.keyword);
  if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive));
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiClient<SubjectListResponse>(`/admin/subjects${qs}`);
}

// ── Ghi — gọi API thật ──────────────────────────────────────────────────────

/** Stats — vẫn dùng mock, chờ API */
export async function getSubjectStats(): Promise<SubjectStatsResponse> {
  return getMockSubjectStats();
}

interface ApiSubjectResponse {
  success: boolean;
  message: string;
  data: Subject;
}

/**
 * POST /api/v1/admin/subjects
 * Tạo mới một môn học (gốc hoặc con).
 */
export async function createSubject(data: CreateSubjectPayload): Promise<Subject> {
  const response = await apiClient<ApiSubjectResponse>('/admin/subjects', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response.data;
}

/**
 * PUT /api/v1/admin/subjects/:id
 * Cập nhật thông tin môn học.
 */
export async function updateSubject(id: number, data: UpdateSubjectPayload): Promise<Subject> {
  const response = await apiClient<ApiSubjectResponse>(`/admin/subjects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  return response.data;
}

/**
 * DELETE /api/v1/admin/subjects/:id
 */
export async function deleteSubject(id: number): Promise<void> {
  await apiClient<void>(`/admin/subjects/${id}`, {
    method: 'DELETE'
  });
}

/**
 * PATCH /api/v1/admin/subjects/:id/reorder
 * Cập nhật vị trí (sortOrder) và nhóm cha (parentId) của một môn học.
 * Dùng sau khi người dùng drag-and-drop trên cây.
 */
export async function reorderSubject(
  id: number,
  payload: { parentId: number | null; sortOrder: number }
): Promise<Subject> {
  const response = await apiClient<ApiSubjectResponse>(`/admin/subjects/${id}/reorder`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  return response.data;
}
