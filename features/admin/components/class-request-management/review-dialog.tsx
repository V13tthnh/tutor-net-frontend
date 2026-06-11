'use client';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
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
import { AlertCircle } from 'lucide-react';
import { reviewClassRequestMutation } from '../../api/mutations';
import type { ClassRequestResponse, ReviewClassRequest } from '../../api/types';

interface ReviewDialogProps {
  open: boolean;
  request: ClassRequestResponse | null;
  action: 'approve' | 'reject' | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ReviewDialog({ open, request, action, onClose, onSuccess }: ReviewDialogProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const mutation = useMutation(reviewClassRequestMutation);

  const handleSubmit = async () => {
    if (!request) return;

    const reviewData: ReviewClassRequest = {
      status: (action === 'approve' ? 'APPROVED' : 'REJECTED') as 'APPROVED' | 'REJECTED',
      rejectionReason: action === 'reject' ? rejectionReason : undefined,
    };

    try {
      await mutation.mutateAsync({
        id: request.id,
        data: reviewData,
      });
      setRejectionReason('');
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error reviewing class request:', error);
    }
  };

  const isApprove = action === 'approve';
  const title = isApprove ? 'Phê duyệt yêu cầu lớp học' : 'Từ chối yêu cầu lớp học';
  const description = isApprove
    ? 'Xác nhận phê duyệt yêu cầu lớp học này?'
    : 'Vui lòng nhập lý do từ chối';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {request && (
            <div className="rounded-lg bg-muted p-3 text-sm space-y-2">
              <p>
                <span className="font-medium">Yêu cầu #:</span> {request.id}
              </p>
              <p>
                <span className="font-medium">Liên hệ:</span> {request.contactName}
              </p>
              <p>
                <span className="font-medium">Môn học:</span> {request.subjectName}
              </p>
            </div>
          )}

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
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending || (!isApprove && !rejectionReason.trim())}
            variant={isApprove ? 'default' : 'destructive'}
          >
            {mutation.isPending ? 'Đang xử lý...' : isApprove ? 'Phê duyệt' : 'Từ chối'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
