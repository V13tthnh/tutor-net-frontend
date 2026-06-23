'use client';

import * as React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CheckCircle2, ShieldAlert, FileText, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { AdminContractResponse, AdminContractStatus } from '../../api/types';

// ─── Status Badge Component ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: AdminContractStatus }) {
  const configs: Record<AdminContractStatus, { label: string; className: string }> = {
    DRAFT: {
      label: 'Bản nháp',
      className: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
    },
    PENDING_SIGNATURE: {
      label: 'Chờ ký',
      className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-700',
    },
    ACTIVE: {
      label: 'Hoạt động',
      className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/40 dark:text-green-400 dark:border-green-700',
    },
    COMPLETED: {
      label: 'Hoàn thành',
      className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-700',
    },
    CANCELLED: {
      label: 'Đã hủy',
      className: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-700',
    },
    VIOLATED: {
      label: 'Vi phạm',
      className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-700',
    },
  };

  const cfg = configs[status] ?? { label: status, className: 'bg-muted text-muted-foreground border-border' };

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider', cfg.className)}>
      {cfg.label}
    </span>
  );
}

interface ContractTableRowProps {
  contract: AdminContractResponse;
  onConfirmPayment: (contract: AdminContractResponse) => void;
  onDisputeClick: (contract: AdminContractResponse) => void;
  isPaymentPending: boolean;
}

export function ContractTableRow({
  contract,
  onConfirmPayment,
  onDisputeClick,
  isPaymentPending,
}: ContractTableRowProps) {
  const today = new Date();
  const deadline = contract.feePaymentDeadline ? new Date(contract.feePaymentDeadline) : null;
  const isOverdue = !contract.isFeePaid && deadline && deadline < today;

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép: ${text}`);
  };

  return (
    <TableRow className="hover:bg-muted/20 transition-colors">
      {/* Hợp đồng / Lớp */}
      <TableCell className="align-top">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs font-bold text-foreground truncate max-w-[100px]">
              {contract.contractNumber}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 text-muted-foreground hover:text-foreground"
              onClick={() => handleCopyText(contract.contractNumber)}
            >
              <Copy className="h-2.5 w-2.5" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono">
            Lớp: {contract.classCode || 'N/A'}
          </p>
        </div>
      </TableCell>

      {/* Môn học */}
      <TableCell className="align-top text-sm font-medium">
        {contract.subjectName}
      </TableCell>

      {/* Gia sư */}
      <TableCell className="align-top">
        <div className="space-y-0.5">
          <p className="font-semibold text-sm text-foreground">{contract.tutorName}</p>
          <p className="text-xs text-muted-foreground font-mono">{contract.tutorPhone}</p>
          <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{contract.tutorEmail}</p>
        </div>
      </TableCell>

      {/* Phụ huynh */}
      <TableCell className="align-top">
        <div className="space-y-0.5">
          <p className="font-semibold text-sm text-foreground">{contract.contactName}</p>
          <p className="text-xs text-muted-foreground font-mono">{contract.contactPhone}</p>
        </div>
      </TableCell>

      {/* Phí nhận lớp */}
      <TableCell className="align-top text-sm font-bold text-foreground">
        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
          contract.introductionFee
        )}
      </TableCell>

      {/* Hạn / Trạng thái Phí */}
      <TableCell className="align-top">
        <div className="space-y-1">
          {contract.isFeePaid ? (
            <div className="space-y-0.5">
              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[9px] px-1.5 py-0.5 border-0">
                Đã đóng phí
              </Badge>
              {contract.paidAt && (
                <p className="text-[9px] text-muted-foreground">
                  {new Date(contract.paidAt).toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-0.5">
              <Badge
                variant="outline"
                className={cn(
                  'font-bold text-[9px] px-1.5 py-0.5 border',
                  isOverdue
                    ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900'
                )}
              >
                {isOverdue ? 'Trễ hạn đóng' : 'Chưa đóng phí'}
              </Badge>
              {deadline && (
                <p className={cn('text-[9px] font-mono', isOverdue ? 'text-rose-600 font-bold' : 'text-muted-foreground')}>
                  Hạn: {deadline.toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>
          )}
        </div>
      </TableCell>

      {/* Trạng thái hợp đồng */}
      <TableCell className="align-top">
        <StatusBadge status={contract.status} />
      </TableCell>

      {/* Thao tác */}
      <TableCell className="text-right align-top">
        <div className="flex gap-1.5 justify-end">
          {/* Confirm Payment button */}
          {!contract.isFeePaid && contract.status === 'ACTIVE' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-semibold cursor-pointer text-emerald-600 border-emerald-200 hover:text-emerald-700 hover:bg-emerald-50"
                  onClick={() => onConfirmPayment(contract)}
                  disabled={isPaymentPending}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="hidden md:inline ml-1.5">Thu phí</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Xác nhận đã thu phí nhận lớp chuyển khoản thủ công</TooltipContent>
            </Tooltip>
          )}

          {/* Dispute button (active, completed, violated, cancelled) */}
          {['ACTIVE', 'PENDING_SIGNATURE', 'COMPLETED'].includes(contract.status) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 cursor-pointer text-rose-500 border-rose-100 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200"
                  onClick={() => onDisputeClick(contract)}
                >
                  <ShieldAlert className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Can thiệp Sự cố / Tranh chấp</TooltipContent>
            </Tooltip>
          )}

          {/* View PDF button */}
          {contract.contractFileUrl && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 cursor-pointer hover:bg-muted"
                  onClick={() => window.open(contract.contractFileUrl, '_blank')}
                >
                  <FileText className="h-4 w-4 text-primary" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Xem Hợp đồng PDF</TooltipContent>
            </Tooltip>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
