'use client';
import { useQuery } from '@tanstack/react-query';
import { adminTransactionByIdOptions } from '../../api/queries';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { Loader2, Copy, Calendar, DollarSign, User, ShieldAlert, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { TransactionStatus, PaymentMethod } from '../../api/types';

interface DetailDialogProps {
  id: number | null;
  onOpenChange: (open: boolean) => void;
}

export function TransactionDetailDialog({ id, onOpenChange }: DetailDialogProps) {
  const { data: transaction, isLoading } = useQuery({
    ...adminTransactionByIdOptions(id || 0),
    enabled: !!id,
  });

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép: ${text}`);
  };

  const getStatusBadge = (status: TransactionStatus) => {
    const configs: Record<TransactionStatus, { label: string; className: string }> = {
      PENDING: {
        label: 'Đang xử lý',
        className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-700',
      },
      SUCCESS: {
        label: 'Thành công',
        className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/40 dark:text-green-400 dark:border-green-700',
      },
      FAILED: {
        label: 'Thất bại',
        className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-700',
      },
      CANCELLED: {
        label: 'Đã hủy',
        className: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-700',
      },
      REFUNDED: {
        label: 'Đã hoàn tiền',
        className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-700',
      },
    };
    const cfg = configs[status] || { label: status, className: 'bg-muted text-muted-foreground border-border' };
    return (
      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider', cfg.className)}>
        {cfg.label}
      </span>
    );
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  return (
    <Dialog open={!!id} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Icons.chat className="h-5 w-5 text-primary" />
            Chi tiết giao dịch
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground font-medium">Đang tải thông tin chi tiết...</span>
          </div>
        ) : transaction ? (
          <div className="space-y-4 text-xs mt-2 font-sans">
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">Mã giao dịch</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-sm font-bold text-primary">{transaction.transactionCode}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-muted-foreground hover:text-foreground"
                    onClick={() => handleCopyText(transaction.transactionCode)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                {getStatusBadge(transaction.status)}
              </div>
            </div>

            <Separator />

            {/* Financial Details */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/20 border rounded-lg">
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-muted-foreground block uppercase flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-emerald-500" />
                  Số tiền
                </span>
                <span className="font-mono font-bold text-sm text-foreground">{formatMoney(transaction.amount)}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-muted-foreground block uppercase flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3 text-blue-500" />
                  Phương thức
                </span>
                <span className="font-semibold text-foreground">{transaction.paymentMethod}</span>
              </div>
            </div>

            {/* Contract & Tutor Info */}
            <div className="space-y-2">
              <div className="flex items-start gap-2.5">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-0.5 flex-1 min-w-0">
                  <span className="text-[9px] font-bold text-muted-foreground block uppercase">Hợp đồng liên quan</span>
                  {transaction.contractNumber ? (
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-bold text-foreground truncate">{transaction.contractNumber}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 text-muted-foreground hover:text-foreground shrink-0"
                        onClick={() => handleCopyText(transaction.contractNumber || '')}
                      >
                        <Copy className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Không có (N/A)</span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <User className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-0.5 flex-1 min-w-0">
                  <span className="text-[9px] font-bold text-muted-foreground block uppercase">Gia sư (Người đóng phí)</span>
                  <p className="font-semibold text-foreground truncate">{transaction.tutorName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{transaction.tutorEmail}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Time Metrics */}
            <div className="space-y-2">
              <div className="flex items-start gap-2.5">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-muted-foreground block uppercase">Thời gian thanh toán</span>
                  <p className="font-medium text-foreground">{formatDate(transaction.paidAt)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-muted-foreground block uppercase">Mã tham chiếu Gateway</span>
                  <p className="font-mono text-muted-foreground truncate">{transaction.gatewayReference || '-'}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-muted-foreground block uppercase">Ngày tạo mã</span>
                  <p className="text-muted-foreground">{formatDate(transaction.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Ghi chú */}
            {transaction.note && (
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground block uppercase">Ghi chú giao dịch</span>
                <p className="p-2 border rounded-lg bg-card text-muted-foreground italic text-[11px] leading-relaxed">
                  "{transaction.note}"
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">Không tìm thấy giao dịch.</div>
        )}

        <DialogFooter className="mt-4">
          <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
