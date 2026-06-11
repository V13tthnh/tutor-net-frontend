'use client';

import { useQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useDataTable } from '@/hooks/use-data-table';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { rolesQueryOptions } from '../../api/queries';
import { columns } from './columns';

export function RolesTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(10),
    keyword: parseAsString,
    sortBy: parseAsString,
    sortDir: parseAsString
  });

  const sortingState = params.sortBy
    ? [{ id: params.sortBy, desc: params.sortDir === 'desc' }]
    : [];

  const filters = {
    page: params.page,
    limit: params.limit,
    ...(params.keyword && { search: params.keyword }),
    ...(sortingState.length > 0 && { sort: JSON.stringify(sortingState) })
  };

  const { data, isPending } = useQuery(rolesQueryOptions(filters));

  const { table } = useDataTable({
    data: data?.items ?? [],
    columns,
    pageCount: data ? Math.ceil(data.total_items / params.limit) : 0,
    shallow: true,
    debounceMs: 500,
    useSplitSort: true,
    initialState: {
      columnPinning: { right: ['actions'] },
      sorting: [{ id: 'id', desc: true }]
    }
  });

  return (
    <div className='space-y-4'>
      <DataTableToolbar table={table} />
      {isPending ? (
        <DataTableSkeleton
          columnCount={columns.length}
          rowCount={params.limit}
          withViewOptions={false}
          withPagination={true}
        />
      ) : (
        <DataTable table={table} />
      )}
    </div>
  );
}

export function RolesTableSkeleton() {
  return (
    <div className='space-y-4 p-4'>
      <Skeleton className='h-10 w-full' />
      <Skeleton className='h-96 w-full' />
    </div>
  );
}
