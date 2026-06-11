'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface BulkReviewDialogProps {
  open: boolean;
  count: number;
  action: 'approve' | 'reject' | null;
  onClose: () => void;
  onSubmit: (action: 'approve' | 'reject', reason?: string) => Promise<void>;
  isLoading: boolean;
}

export function BulkReviewDialog({
  open,
  count,
  action,
  onClose,
  onSubmit,
  isLoading
}: BulkReviewDialogProps) {
  const [rejectionReason, setRejectionReason] = useState('');

  const handleSubmit = async () => {
    if (!action) return;
    await onSubmit(action, action === 'reject' ? rejectionReason : undefined);
    setRejectionReason('');
  };

  const isApprove = action === 'approve';
  const title = isApprove ? 'Phê duyệt hàng loạt' : 'Từ chối hàng loạt';
  const description = isApprove
    ? `Xác nhận phê duyệt ${count} yêu cầu lớp học?`
    : `Từ chối ${count} yêu cầu lớp học`;

  const icon = isApprove ? CheckCircle2 : XCircle;
  const Icon = icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Icon className={isApprove ? 'text-green-600' : 'text-red-600'} size={24} />
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 rounded-lg flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              Bạn sắp {isApprove ? 'phê duyệt' : 'từ chối'} <strong>{count} yêu cầu</strong>. Hành động này không thể hoàn tác.
            </div>
          </div>

          {!isApprove && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Lý do từ chối *</label>
              <Textarea
                placeholder="Nhập lý do từ chối..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="resize-none"
                rows={4}
              />
              {!rejectionReason && (
                <div className="flex items-center gap-2 text-xs text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  Vui lòng nhập lý do từ chối
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || (!isApprove && !rejectionReason.trim())}
            variant={isApprove ? 'default' : 'destructive'}
          >
            {isLoading ? 'Đang xử lý...' : isApprove ? 'Phê duyệt' : 'Từ chối'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
