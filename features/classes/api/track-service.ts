import { apiClient } from '@/lib/api-client';
import type { ClassRequest } from './types';

export interface TrackClassRequest {
  classCode: string;
  contactPhone: string;
}

export interface TrackClassResponse {
  success: boolean;
  message: string;
  data: ClassRequest;
  timestamp: string;
}

export async function trackClassRequest(payload: TrackClassRequest): Promise<TrackClassResponse> {
  return apiClient<TrackClassResponse>('/class-requests/track', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
