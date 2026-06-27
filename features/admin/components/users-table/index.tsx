'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates, parseAsNativeArrayOf } from 'nuqs';
import * as React from 'react';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { ForbiddenState } from '@/components/ui/table/table-forbidden-state';
import { usersQueryOptions, userFilterOptionsQueryOptions } from '../../api/queries';
import { getColumns } from './columns';
import { ROLE_OPTIONS, STATUS_OPTIONS } from './options';

export function UsersTable() {
  const { data: filterOptions } = useQuery(userFilterOptionsQueryOptions());

  const roleOptions = React.useMemo(() => {
    if (!filterOptions?.roles) return ROLE_OPTIONS;
    return filterOptions.roles.map((r) => ({
      value: r.slug,
      label: r.name
    }));
  }, [filterOptions]);

  const statusOptions = React.useMemo(() => {
    if (!filterOptions?.statuses) return STATUS_OPTIONS;
    return filterOptions.statuses.map((s) => ({
      value: s.value,
      label: s.label
    }));
  }, [filterOptions]);

  const columns = React.useMemo(
    () => getColumns(roleOptions, statusOptions),
    [roleOptions, statusOptions]
  );

  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(10),
    keyword: parseAsString,
    roles: parseAsNativeArrayOf(parseAsString),
    status: parseAsNativeArrayOf(parseAsString),
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
    ...(params.roles && params.roles.length > 0 && { roles: params.roles }),
    ...(params.status && params.status.length > 0 && { status: params.status }),
    ...(sortingState.length > 0 && { sort: JSON.stringify(sortingState) })
  };

  const { data, isPending, isError } = useQuery(usersQueryOptions(filters));

  const pageCount = data ? Math.ceil(data.total_users / params.limit) : 0;

  const { table } = useDataTable({
    data: data?.users ?? [],
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500,
    useSplitSort: true,
    useNativeArrayFilters: true,
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
      ) : isError ? (
        <ForbiddenState />
      ) : (
        <DataTable table={table} />
      )}
    </div>
  );
}

export function UsersTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}
