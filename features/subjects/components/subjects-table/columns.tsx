'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Subject } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';
import { STATUS_OPTIONS } from './options';
import { format } from 'date-fns';

export const columns: ColumnDef<Subject>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<Subject, unknown> }) => (
      <DataTableColumnHeader column={column} title='Tên môn học' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col gap-0.5'>
        <span className='font-medium'>{row.original.name}</span>
        <span className='text-muted-foreground text-xs font-mono'>{row.original.slug}</span>
      </div>
    ),
    meta: {
      label: 'Tên',
      placeholder: 'Tìm môn học...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'description',
    header: 'MÔ TẢ',
    cell: ({ row }) => (
      <span className='max-w-[300px] truncate block text-sm text-muted-foreground'>
        {row.original.description || '—'}
      </span>
    )
  },
  {
    accessorKey: 'parentId',
    header: 'CẤP',
    cell: ({ row }) => {
      const parentId = row.original.parentId;
      if (!parentId) {
        return <Badge variant='outline' className='text-xs'>Cấp 1</Badge>;
      }
      return <Badge variant='secondary' className='text-xs'>Cấp con</Badge>;
    }
  },
  {
    accessorKey: 'isActive',
    header: 'TRẠNG THÁI',
    cell: ({ row }) => {
      const isActive = row.original.isActive;
      return <Badge variant={isActive ? 'default' : 'secondary'}>{isActive ? 'Hoạt động' : 'Đã ẩn'}</Badge>;
    },
    enableColumnFilter: true,
    meta: {
      label: 'Trạng thái',
      variant: 'multiSelect' as const,
      options: STATUS_OPTIONS
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'NGÀY TẠO',
    cell: ({ cell }) => {
      const date = cell.getValue<string>();
      return <span>{format(new Date(date), 'dd/MM/yyyy')}</span>;
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
