export type ContractStatus = 'DRAFT' | 'PENDING_SIGNATURE' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'VIOLATED';

export interface ContractResponse {
  id: number;
  contractNumber: string;
  classCode: string;
  subjectName: string;
  partnerName: string;
  targetTutorId?: number;
  contactName: string;
  contactPhone: string;
  introductionFee: number;
  effectiveDate: string;
  feePaymentDeadline: string;
  freeTrialCount: number;
  status: ContractStatus;
  contractFileUrl?: string;
  createdAt: string;
}

export interface ContractFilters {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: ContractStatus;
  sortBy?: string;
  sortDir?: string;
}
