'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '../../../../components/ui/table/data-table-column-header';
import type { User } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';
import { ROLE_OPTIONS, STATUS_OPTIONS } from './options';
import { Checkbox } from '@/components/ui/checkbox';

export const getColumns = (
  roleOptions: { value: string; label: string }[],
  statusOptions: { value: string; label: string }[]
): ColumnDef<User>[] => [
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
      header: ({ column }: { column: Column<User, unknown> }) => (
        <DataTableColumnHeader column={column} title='ID' />
      ),
      cell: ({ row }) => (
        <span className='font-mono text-xs text-muted-foreground'>#{row.original.id}</span>
      ),
      enableSorting: true,
      size: 70
    },
    {
      id: 'keyword',
      accessorFn: (row) => row.first_name,
      header: ({ column }: { column: Column<User, unknown> }) => (
        <DataTableColumnHeader column={column} title='Họ và tên' />
      ),
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <span className='font-medium'>
            {row.original.first_name}
          </span>
          <span className='text-muted-foreground text-xs'>{row.original.email}</span>
        </div>
      ),
      meta: {
        label: 'Họ và tên',
        placeholder: 'Tìm kiếm quản trị viên...',
        variant: 'text' as const,
        icon: Icons.text
      },
      enableColumnFilter: true
    },
    {
      accessorKey: 'phone',
      header: 'SỐ ĐIỆN THOẠI'
    },
    {
      id: 'roles',
      accessorKey: 'role',
      enableSorting: false,
      header: ({ column }: { column: Column<User, unknown> }) => (
        <DataTableColumnHeader column={column} title='Vai trò' />
      ),
      cell: ({ cell }) => {
        const roleVal = cell.getValue<User['role']>() || '';
        return (
          <Badge variant='outline' className='capitalize'>
            {roleVal.replace('_', ' ')}
          </Badge>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: 'roles',
        variant: 'multiSelect' as const,
        options: roleOptions
      }
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'TRẠNG THÁI',
      cell: ({ cell }) => {
        const status = cell.getValue<User['status']>();
        const variant =
          status === 'Active' ? 'default' : status === 'Inactive' ? 'secondary' : 'outline';

        // Việt hóa trạng thái hiển thị
        let statusLabel = status;
        if (status === 'Active') statusLabel = 'Hoạt động';
        else if (status === 'Inactive') statusLabel = 'Tạm ngưng';
        else if (status === 'Suspended') statusLabel = 'Bị khóa';
        else if (status === 'Pending_verification') statusLabel = 'Chờ xác minh';

        return <Badge variant={variant}>{statusLabel}</Badge>;
      },
      enableColumnFilter: true,
      meta: {
        label: 'status',
        variant: 'multiSelect' as const,
        options: statusOptions
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => <CellAction data={row.original} />
    }
  ];
