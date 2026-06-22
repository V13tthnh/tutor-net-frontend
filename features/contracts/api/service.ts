import { apiClient } from '@/lib/api-client';
import type { PageResponse } from '@/features/classes/api/types';
import type { ContractResponse, ContractFilters } from './types';

export async function getMyContracts(
  filters: ContractFilters
): Promise<{ success: boolean; data: PageResponse<ContractResponse> }> {
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
  }
  if (filters.sortDir) {
    params.append('sortDir', filters.sortDir);
  }

  return apiClient<{ success: boolean; data: PageResponse<ContractResponse> }>(
    `/contracts?${params.toString()}`
  );
}

export async function signContract(contractId: number): Promise<void> {
  return apiClient<void>(`/contracts/${contractId}/sign`, {
    method: 'POST',
  });
}

export async function downloadContractPdf(contractId: number): Promise<Blob> {
  return apiClient<Blob>(`/contracts/${contractId}/download-pdf`, {
    responseType: 'blob',
  });
}

