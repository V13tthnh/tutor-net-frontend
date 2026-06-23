'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, AlertCircle } from 'lucide-react';
import type { AdminContractResponse } from '../../api/types';

interface PaymentConfirmationDialogProps {
  open: boolean;
  contract: AdminContractResponse | null;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

export function PaymentConfirmationDialog({
  open,
  contract,
  onClose,
  onConfirm,
  loading,
}: PaymentConfirmationDialogProps) {
  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !loading && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-600">
            <CreditCard className="h-5 w-5" />
            Xác nhận Thu phí Nhận lớp
          </DialogTitle>
          <DialogDescription>
            Hành động này sẽ đánh dấu hợp đồng đã được thanh toán phí dịch vụ đầy đủ.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/50 p-4 text-xs space-y-2.5">
            <div className="flex justify-between items-center pb-2 border-b border-emerald-100/50 dark:border-emerald-900/30">
              <span className="font-medium text-muted-foreground">Mã hợp đồng:</span>
              <span className="font-mono font-bold text-foreground text-sm">{contract.contractNumber}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground/80">Lớp học</p>
                <p className="font-semibold text-foreground mt-0.5">{contract.classCode || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground/80">Môn học</p>
                <p className="font-semibold text-foreground mt-0.5">{contract.subjectName}</p>
              </div>
              <div className="col-span-2 pt-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground/80">Gia sư (Bên B)</p>
                <p className="font-semibold text-foreground mt-0.5">{contract.tutorName} ({contract.tutorPhone})</p>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-100/50 dark:border-emerald-900/30 flex justify-between items-center">
              <span className="font-bold text-foreground">Số tiền phí cần thu:</span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
                  contract.introductionFee
                )}
              </span>
            </div>
          </div>

          <div className="flex gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
            <p className="leading-normal">
              Vui lòng xác nhận rằng gia sư đã thực hiện thanh toán phí nhận lớp qua hình thức chuyển khoản ngân hàng hoặc tiền mặt trước khi bấm xác nhận.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy bỏ
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận Đã thu phí'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
