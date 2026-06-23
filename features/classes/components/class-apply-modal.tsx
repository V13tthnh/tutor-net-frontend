'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { ClassRequest } from '../api/types';
import {
  IconX,
  IconCoins,
  IconCalendarEvent,
  IconClock,
  IconMessageCircle,
  IconLoader2,
  IconSend,
} from '@tabler/icons-react';

interface ClassApplyModalProps {
  classRequest: ClassRequest | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (classRequestId: number, message: string) => Promise<void>;
}

export function ClassApplyModal({
  classRequest,
  open,
  onClose,
  onSubmit,
}: ClassApplyModalProps) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!classRequest) return null;

  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(classRequest.proposedPrice);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      await onSubmit(classRequest.id, message.trim());
      setMessage('');
      onClose();
    } catch (err) {
      // Let the caller handle the error display
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !submitting && onClose()}>
      <DialogContent
        className="flex w-[95vw] max-w-md flex-col overflow-hidden rounded-xl border bg-background p-0 gap-0 shadow-2xl [&>button]:hidden animate-in fade-in-50 zoom-in-95 duration-200"
        hideCloseButton
      >
        <DialogTitle className="sr-only">Ứng tuyển dạy lớp {classRequest.subjectName}</DialogTitle>

        {/* Header */}
        <header className="flex shrink-0 items-center justify-between px-6 py-4 bg-primary text-primary-foreground">
          <span className="font-bold text-base tracking-wide uppercase">
            Ứng tuyển nhận lớp dạy
          </span>
          <button
            type="button"
            onClick={() => {
              if (submitting) return;
              onClose();
            }}
            disabled={submitting}
            aria-label="Đóng"
            className="rounded-full p-1.5 transition-colors hover:bg-primary-foreground/10 text-primary-foreground cursor-pointer disabled:opacity-50"
          >
            <IconX size={18} />
          </button>
        </header>

        {/* Class summary card */}
        <div className="px-6 py-4 border-b bg-muted/30 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default" className="bg-primary/95 text-primary-foreground font-semibold px-2.5 py-0.5 text-xs">
              {classRequest.subjectName}
            </Badge>
            <span className="text-xs font-mono text-muted-foreground">Lớp: {classRequest.gradeLevel}</span>
          </div>

          <div className="grid grid-cols-2 gap-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium">
              <IconCoins size={14} className="text-primary" />
              <span>Học phí: <strong className="text-foreground">{formattedPrice}/tháng</strong></span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <IconCalendarEvent size={14} className="text-primary" />
              <span>Lịch học: <strong className="text-foreground">{classRequest.sessionsPerWeek} buổi/tuần</strong></span>
            </div>
            <div className="flex items-center gap-1.5 font-medium col-span-2">
              <IconClock size={14} className="text-primary" />
              <span>Thời lượng: <strong className="text-foreground">{classRequest.durationMinutes} phút/buổi</strong></span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Viết một lời nhắn ngắn giới thiệu về bản thân, kinh nghiệm dạy học của bạn liên quan đến môn này để phụ huynh lựa chọn bạn dễ dàng hơn.
          </p>

          {/* Message textarea */}
          <div className="space-y-1.5">
            <Label htmlFor="apply-message" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <IconMessageCircle size={14} className="text-muted-foreground" />
              Lời nhắn tự giới thiệu <span className="text-muted-foreground font-normal">(không bắt buộc)</span>
            </Label>
            <Textarea
              id="apply-message"
              disabled={submitting}
              placeholder="VD: Chào phụ huynh, em đang là sinh viên trường ĐH Sư Phạm Hà Nội khoa Toán, có 2 năm kinh nghiệm ôn thi đại học cho các bạn học sinh..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={500}
              className="resize-none text-sm"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
              <span>Tối đa 500 ký tự</span>
              <span>{message.length}/500</span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={onClose}
              className="flex-1 h-10 cursor-pointer font-semibold"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 h-10 cursor-pointer font-semibold gap-1.5 shadow-sm"
            >
              {submitting ? (
                <>
                  <IconLoader2 size={15} className="animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <IconSend size={15} />
                  Xác nhận dạy
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
