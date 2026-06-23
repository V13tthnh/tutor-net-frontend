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
import { AlertCircle, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { forceCancelTutorInvitationMutation } from '../../api/mutations';
import type { AdminTutorInvitationTableResponse } from '../../api/types';

interface CancelInvitationDialogProps {
  open: boolean;
  invitation: AdminTutorInvitationTableResponse | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CancelInvitationDialog({ open, invitation, onClose, onSuccess }: CancelInvitationDialogProps) {
  const [cancelReason, setCancelReason] = useState('');
  const mutation = useMutation(forceCancelTutorInvitationMutation);

  const handleSubmit = async () => {
    if (!invitation || !cancelReason.trim()) return;

    try {
      await mutation.mutateAsync({
        id: invitation.id,
        data: { cancelReason: cancelReason.trim() },
      });
      toast.success('Đã hủy lời mời thành công');
      setCancelReason('');
      onClose();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.message || 'Lỗi khi hủy lời mời');
    }
  };

  const handleClose = () => {
    setCancelReason('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (mutation.isPending) return;
      if (!v) handleClose();
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            Hủy lời mời
          </DialogTitle>
          <DialogDescription>
            Hành động này sẽ hủy lời mời và không thể hoàn tác. Vui lòng nhập lý do hủy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {invitation && (
            <div className="rounded-lg bg-muted p-3 text-sm space-y-2">
              <p>
                <span className="font-medium">Lời mời #:</span> {invitation.id}
              </p>
              <p>
                <span className="font-medium">Phụ huynh:</span> {invitation.studentName} — {invitation.studentPhone}
              </p>
              <p>
                <span className="font-medium">Gia sư:</span> {invitation.tutorName}
              </p>
              <p>
                <span className="font-medium">Môn học:</span> {invitation.subjectName}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Lý do hủy *</label>
            <Textarea
              placeholder="Nhập lý do hủy lời mời (ví dụ: vi phạm quy định, ngôn từ không phù hợp, spam...)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="resize-none"
              rows={4}
              disabled={mutation.isPending}
            />
            {!cancelReason.trim() && (
              <div className="flex items-center gap-2 text-xs text-yellow-600">
                <AlertCircle className="h-4 w-4" />
                Vui lòng nhập lý do hủy lời mời
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
            Hủy bỏ
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending || !cancelReason.trim()}
            variant="destructive"
          >
            {mutation.isPending ? 'Đang xử lý...' : 'Xác nhận hủy'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
