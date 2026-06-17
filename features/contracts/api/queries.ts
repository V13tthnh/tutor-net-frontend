import { queryOptions } from '@tanstack/react-query';
import { getMyContracts } from './service';
import type { ContractFilters } from './types';

export const myContractsQueryOptions = (filters: ContractFilters = {}) =>
  queryOptions({
    queryKey: ['contracts', 'my-contracts', filters],
    queryFn: () => getMyContracts(filters),
  });
