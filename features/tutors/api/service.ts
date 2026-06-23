import { fakeTutors } from '@/constants/mock-api-tutors';
import type { TutorFilters, TutorsResponse, TutorByIdResponse, FilterOptionsResponse, ContractPreviewResponse, ApiResponse } from './types';
import type { Tutor } from '@/constants/mock-api-tutors';
import { apiClient } from '@/lib/api-client';

function mapBackendTutorToTutor(p: any): Tutor {
  const parts = (p.fullName || '').split(' ');
  const first_name = parts[0] || '';
  const last_name = parts.slice(1).join(' ') || '';

  const teachingMethodMap: Record<string, string> = {
    'ONLINE': 'Online (Trực tuyến)',
    'OFFLINE': 'Offline (Tại nhà)',
    'HYBRID': 'Onlive + Offline'
  };

  let teaching_method = 'Online (Trực tuyến)';
  const modeVal = p.teachingMode || (p.teachingModes && p.teachingModes.length > 0 ? p.teachingModes[0] : null);
  if (modeVal) {
    if (modeVal === 'ONLINE') {
      teaching_method = 'Online (Trực tuyến)';
    } else if (modeVal === 'OFFLINE') {
      teaching_method = 'Offline (Tại nhà)';
    } else if (modeVal === 'HYBRID') {
      teaching_method = 'Onlive + Offline';
    }
  } else if (p.teachingModes && p.teachingModes.length > 0) {
    const modes = p.teachingModes;
    if (modes.includes('ONLINE') && modes.includes('OFFLINE')) {
      teaching_method = 'Onlive + Offline';
    } else if (modes.includes('HYBRID')) {
      teaching_method = 'Onlive + Offline';
    } else if (modes.includes('OFFLINE')) {
      teaching_method = 'Offline (Tại nhà)';
    } else {
      teaching_method = 'Online (Trực tuyến)';
    }
  }

  const genderMap: Record<string, string> = {
    'MALE': 'Nam',
    'FEMALE': 'Nữ',
    'OTHER': 'Khác'
  };

  return {
    id: p.id,
    userId: p.userId || null,
    first_name,
    last_name,
    avatar_url: p.avatarUrl || '',
    gender: genderMap[p.gender] || 'Khác',
    age: 20,
    province: p.provinces && p.provinces.length > 0 ? p.provinces[0] : 'Chưa cập nhật',
    subjects: p.subjects ? p.subjects.map((s: any) => s.name) : [],
    levels: [],
    teaching_method,
    price_per_session: p.minHourlyRate || 0,
    experience_years: p.experienceYears || 0,
    rating: p.ratingAvg || 0,
    total_reviews: p.ratingCount || 0,
    university: p.headline || 'Đang cập nhật',
    bio: p.bio || '',
    is_verified: true,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    subjectsDetail: p.subjects || [],
    provincesDetail: p.provinces || []
  } as any;
}

export async function getTutors(filters: TutorFilters): Promise<TutorsResponse> {
  const params = new URLSearchParams();

  if (filters.page) {
    params.append('page', String(filters.page));
  }
  if (filters.limit) {
    params.append('size', String(filters.limit));
  }
  if (filters.search) {
    params.append('keyword', filters.search);
  }
  if (filters.subjects) {
    filters.subjects.split(',').filter(Boolean).forEach(id => {
      params.append('subjectIds', id);
    });
  }
  if (filters.province) {
    filters.province.split(',').filter(Boolean).forEach(p => {
      params.append('provinces', p);
    });
  }
  if (filters.gender) {
    filters.gender.split(',').filter(Boolean).forEach(g => {
      params.append('genders', g);
    });
  }
  if (filters.teaching_method) {
    filters.teaching_method.split(',').filter(Boolean).forEach(m => {
      params.append('teachingModes', m);
    });
  }
  if (filters.sort) {
    const [field, dir] = filters.sort.split(':');
    const sortBy = field === 'rating' ? 'ratingAvg' 
                 : field === 'price_per_session' ? 'minHourlyRate' 
                 : field === 'experience_years' ? 'experienceYears' 
                 : field || 'ratingAvg';
    params.append('sortBy', sortBy);
    params.append('sortDir', dir || 'desc');
  }

  const res = await apiClient<any>(`/tutors?${params.toString()}`);
  const data = res.data || {};

  return {
    success: true,
    time: res.timestamp || new Date().toISOString(),
    total_tutors: data.totalElements || 0,
    offset: (data.page || 0) * (data.size || 12),
    limit: data.size || 12,
    tutors: (data.content || []).map(mapBackendTutorToTutor)
  };
}

export async function getTutorFilterOptions(): Promise<FilterOptionsResponse> {
  const res = await apiClient<{ success: boolean; data: FilterOptionsResponse }>('/tutors/filter-options');
  return res.data;
}

export async function getFeaturedTutors(count?: number): Promise<Tutor[]> {
  try {
    const res = await getTutors({ page: 1, limit: count || 6, sort: 'rating:desc' });
    return res.tutors;
  } catch (e) {
    console.error('Error fetching featured tutors, fallback to mock:', e);
    return fakeTutors.getFeatured(count);
  }
}

export async function getTutorById(id: number): Promise<TutorByIdResponse> {
  try {
    const res = await apiClient<any>(`/tutors/${id}`);
    if (res && (res.id !== undefined || res.data !== undefined)) {
      const tutorData = res.data !== undefined ? res.data : res;
      return {
        success: true,
        tutor: tutorData
      };
    }
  } catch (e) {
    console.error('Failed to fetch tutor details by ID from API, falling back to mock:', e);
  }
  return fakeTutors.getTutorById(id);
}

export async function getTutorStats(id: number): Promise<TutorByIdResponse> {
  return fakeTutors.getTutorById(id);
}

export async function getContractPreview(id: number): Promise<ApiResponse<ContractPreviewResponse>> {
  return apiClient<ApiResponse<ContractPreviewResponse>>(`/tutor/invitations/${id}/contract-preview`);
}

export async function acceptAndSignContract(id: number): Promise<ApiResponse<void>> {
  return apiClient<ApiResponse<void>>(`/tutor/invitations/${id}/accept-and-sign`, {
    method: 'POST',
  });
}

export async function rejectInvitation(id: number, reason: string | null): Promise<void> {
  return apiClient<void>(`/tutor/invitations/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ rejectionReason: reason }),
  });
}

