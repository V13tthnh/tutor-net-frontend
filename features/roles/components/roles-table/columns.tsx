'use client';
import type { Role } from '../../api/types';
import { ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { DataTableColumnHeader } from '../../../../components/ui/table/data-table-column-header';

export const columns: ColumnDef<Role>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Chọn tất cả'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Chọn dòng'
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40
  },
  {
    id: 'id',
    accessorKey: 'id',
    header: ({ column }) => <DataTableColumnHeader column={column} title='ID' />,
    cell: ({ row }) => (
      <span className='font-mono text-xs text-muted-foreground'>#{row.original.id}</span>
    ),
    enableSorting: true,
    size: 70
  },
  {
    id: 'keyword',
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Tên vai trò' />,
    meta: { label: 'Tên vai trò', placeholder: 'Tìm kiếm vai trò...', variant: 'text', icon: Icons.text },
    enableColumnFilter: true
  },
  {
    id: 'description',
    accessorKey: 'description',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Mô tả' />,
  },
  {
    id: 'permissions',
    header: 'Quyền hạn',
    cell: ({ row }) => {
      const permissions = row.original.permissions;
      return (
        <div className="flex flex-wrap gap-1 max-w-[300px]">
          {permissions.slice(0, 3).map(p => (
            <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
          ))}
          {permissions.length > 3 && (
            <Badge variant="outline" className="text-[10px]">+{permissions.length - 3} khác</Badge>
          )}
        </div>
      );
    }
  },
  {
    id: 'user_count',
    accessorKey: 'user_count',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Số người dùng' />,
    cell: ({ row }) => {
      const count = row.original.user_count ?? 0;
      return <span className='font-medium pl-4'>{count}</span>;
    },
    enableSorting: true
  },
  {
    id: 'created_at',
    accessorKey: 'created_at',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Ngày tạo' />,
    cell: ({ row }) => format(new Date(row.original.created_at), 'dd/MM/yyyy')
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
