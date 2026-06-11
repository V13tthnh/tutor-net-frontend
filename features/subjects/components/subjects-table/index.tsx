'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useQuery } from '@tanstack/react-query';
import { parseAsBoolean, parseAsString, useQueryStates } from 'nuqs';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { subjectsQueryOptions } from '../../api/queries';
import { columns } from './columns';

export function SubjectsTable() {
  const [params] = useQueryStates({
    // keyword — tìm kiếm theo tên, slug
    keyword: parseAsString,
    // isActive — lọc theo trạng thái: true | false | null (tất cả)
    isActive: parseAsBoolean
  });

  const filters = {
    ...(params.keyword && { keyword: params.keyword }),
    ...(params.isActive !== null && { isActive: params.isActive ?? undefined })
  };

  const { data, isPending } = useQuery(subjectsQueryOptions(filters));

  // API trả về flat list không phân trang
  const subjects = data?.data ?? [];
  const pageCount = 1;

  const { table } = useDataTable({
    data: subjects,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 400,
    initialState: {
      columnPinning: { right: ['actions'] }
    }
  });

  return (
    <div className='space-y-4'>
      <DataTableToolbar table={table} />
      {isPending ? (
        <DataTableSkeleton
          columnCount={columns.length}
          rowCount={10}
          withViewOptions={false}
          withPagination={false}
        />
      ) : (
        <DataTable table={table} />
      )}
    </div>
  );
}

export function SubjectsTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
    </div>
  );
}
