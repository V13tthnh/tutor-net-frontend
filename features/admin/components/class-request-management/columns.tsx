'use client';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, CheckCircle2, XCircle } from 'lucide-react';
import type { ClassRequestResponse } from '../../api/types';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Chờ duyệt', variant: 'secondary' },
  APPROVED: { label: 'Đã duyệt', variant: 'default' },
  REJECTED: { label: 'Từ chối', variant: 'destructive' },
  CANCELLED: { label: 'Hủy', variant: 'outline' },
};

const teachingModeConfig: Record<string, string> = {
  ONLINE: 'Online',
  OFFLINE: 'Tại nhà',
  HYBRID: 'Kết hợp',
};

type OnRowAction = (request: ClassRequestResponse, action: 'view' | 'approve' | 'reject') => void;

export const createClassRequestColumns = (onRowAction: OnRowAction): ColumnDef<ClassRequestResponse>[] => [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => <span className="font-mono text-sm">#{row.getValue('id')}</span>,
    size: 80,
  },
  {
    accessorKey: 'contactName',
    header: 'Tên liên hệ',
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.getValue('contactName')}</p>
        <p className="text-xs text-muted-foreground">{row.original.contactPhone}</p>
      </div>
    ),
  },
  {
    accessorKey: 'subjectName',
    header: 'Môn học',
    cell: ({ row }) => <span>{row.getValue('subjectName')}</span>,
  },
  {
    accessorKey: 'gradeLevel',
    header: 'Khối lớp',
    cell: ({ row }) => <span>{row.getValue('gradeLevel')}</span>,
  },
  {
    accessorKey: 'teachingMode',
    header: 'Hình thức',
    cell: ({ row }) => {
      const mode = row.getValue('teachingMode') as string;
      return <span className="text-sm">{teachingModeConfig[mode] || mode}</span>;
    },
  },
  {
    accessorKey: 'proposedPrice',
    header: 'Học phí',
    cell: ({ row }) => (
      <span className="font-medium">
        {(row.getValue('proposedPrice') as number).toLocaleString('vi-VN')}đ
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Trạng thái',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const config = statusConfig[status] || { label: status, variant: 'default' };
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Ngày tạo',
    cell: ({ row }) => new Date(row.getValue('createdAt') as string).toLocaleDateString('vi-VN'),
  },
  {
    id: 'actions',
    header: 'Thao tác',
    cell: ({ row }) => {
      const request = row.original;
      return (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRowAction(request, 'view')}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {request.status === 'PENDING' && (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={() => onRowAction(request, 'approve')}
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onRowAction(request, 'reject')}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      );
    },
  },
];
