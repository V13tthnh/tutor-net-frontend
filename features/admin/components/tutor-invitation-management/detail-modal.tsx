'use client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  IconX,
  IconUser,
  IconPhone,
  IconBook,
  IconMessage,
  IconClock,
  IconId,
  IconCalendar,
  IconAlertCircle,
} from '@tabler/icons-react';
import type { AdminTutorInvitationTableResponse, InvitationStatus } from '../../api/types';

interface TutorInvitationDetailModalProps {
  invitation: AdminTutorInvitationTableResponse | null;
  open: boolean;
  onClose: () => void;
  onCancel?: () => void;
}

const STATUS_CONFIG: Record<
  InvitationStatus,
  { label: string; bgClass: string; textClass: string; borderClass: string }
> = {
  PENDING: {
    label: 'Đang chờ',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-700 dark:text-amber-400',
    borderClass: 'border-amber-300 dark:border-amber-700',
  },
  ACCEPTED: {
    label: 'Đã nhận',
    bgClass: 'bg-green-500/10',
    textClass: 'text-green-700 dark:text-green-400',
    borderClass: 'border-green-300 dark:border-green-700',
  },
  REJECTED: {
    label: 'Từ chối',
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-700 dark:text-red-400',
    borderClass: 'border-red-300 dark:border-red-700',
  },
  CANCELED_BY_ADMIN: {
    label: 'Đã hủy (Admin)',
    bgClass: 'bg-gray-500/10',
    textClass: 'text-gray-700 dark:text-gray-400',
    borderClass: 'border-gray-300 dark:border-gray-600',
  },
};

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <Icon size={16} className="text-muted-foreground shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-foreground mt-0.5 break-words">{value || '—'}</p>
      </div>
    </div>
  );
}

export function TutorInvitationDetailModal({
  invitation,
  open,
  onClose,
  onCancel,
}: TutorInvitationDetailModalProps) {
  if (!invitation) return null;

  const statusConfig = STATUS_CONFIG[invitation.status] ?? {
    label: invitation.status,
    bgClass: 'bg-muted',
    textClass: 'text-foreground',
    borderClass: 'border-border',
  };

  const formattedPrice =
    invitation.proposedPrice != null
      ? new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
          maximumFractionDigits: 0,
        }).format(invitation.proposedPrice)
      : '—';

  const formattedDate = new Date(invitation.createdAt).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const canCancel = invitation.status === 'PENDING';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="flex w-[95vw] max-w-2xl flex-col overflow-hidden rounded-xl border bg-background p-0 gap-0 shadow-2xl [&>button]:hidden animate-in fade-in-50 zoom-in-95 duration-200"
        hideCloseButton
      >
        <DialogTitle className="sr-only">Chi tiết lời mời #{invitation.id}</DialogTitle>

        {/* Header */}
        <header className="flex shrink-0 items-center justify-between px-6 py-4 bg-primary text-primary-foreground">
          <div className="flex items-center gap-3">
            <span className="font-bold text-base tracking-wide uppercase">Chi tiết Lời mời Gia sư</span>
            <span className="text-xs font-mono opacity-70">#{invitation.id}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-full p-1.5 transition-colors hover:bg-primary-foreground/10 text-primary-foreground cursor-pointer"
          >
            <IconX size={18} />
          </button>
        </header>

        {/* Badges bar */}
        <div className="px-6 py-3 border-b bg-muted/30 flex flex-wrap items-center gap-2">
          <span className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full text-xs font-bold">
            {invitation.subjectName}
          </span>
          <span
            className={`${statusConfig.bgClass} ${statusConfig.textClass} ${statusConfig.borderClass} border px-2.5 py-0.5 rounded-full text-xs font-bold`}
          >
            {statusConfig.label}
          </span>
          {invitation.classCode && (
            <span className="text-[11px] font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded border">
              {invitation.classCode}
            </span>
          )}
          <span className="text-[11px] text-muted-foreground ml-auto">
            {formattedPrice}
          </span>
        </div>

        {/* Body: 2-column layout (thiết kế: Bên mời | Bên nhận) */}
        <div className="p-6 overflow-y-auto max-h-[65vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* === CỘT TRÁI: Bên mời (Phụ huynh) === */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-l-2 border-primary pl-2">
                Bên mời — Phụ huynh
              </h3>
              <div className="bg-muted/30 rounded-xl border p-4 space-y-4">
                <InfoRow icon={IconUser} label="Họ tên" value={invitation.studentName} />
                <InfoRow icon={IconPhone} label="Số điện thoại" value={invitation.studentPhone} />
                <InfoRow
                  icon={IconCalendar}
                  label="Thời gian gửi"
                  value={formattedDate}
                />
              </div>

              {/* Nội dung lời nhắn */}
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-l-2 border-primary pl-2 mb-3">
                  Nội dung lời nhắn
                </h4>
                {invitation.message ? (
                  <div className="bg-muted/40 rounded-xl border p-4 italic text-sm text-foreground/90 leading-relaxed flex items-start gap-2">
                    <IconMessage size={18} className="text-primary shrink-0 mt-0.5" />
                    <span>"{invitation.message}"</span>
                  </div>
                ) : (
                  <div className="bg-muted/20 rounded-xl border border-dashed p-4 text-sm text-muted-foreground text-center">
                    Không có lời nhắn
                  </div>
                )}
              </div>
            </div>

            {/* === CỘT PHẢI: Bên nhận (Gia sư) === */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-l-2 border-amber-500 pl-2">
                Bên nhận — Gia sư
              </h3>
              <div className="bg-amber-500/5 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-4">
                <InfoRow icon={IconUser} label="Họ tên gia sư" value={invitation.tutorName} />
                <InfoRow
                  icon={IconId}
                  label="Mã Gia sư (Tutor ID)"
                  value={invitation.tutorId ? `#${invitation.tutorId}` : '—'}
                />
                <InfoRow icon={IconBook} label="Môn học" value={invitation.subjectName} />

                {/* Trạng thái phản hồi */}
                <div className="flex items-start gap-2.5">
                  <IconClock size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Trạng thái phản hồi</p>
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConfig.bgClass} ${statusConfig.textClass} ${statusConfig.borderClass}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lý do hủy (nếu có) */}
              {invitation.status === 'CANCELED_BY_ADMIN' && invitation.cancelReason && (
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-l-2 border-destructive pl-2 mb-3">
                    Lý do hủy
                  </h4>
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-2">
                    <IconAlertCircle size={16} className="text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-300">{invitation.cancelReason}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex border-t bg-muted/20 px-6 py-4 shrink-0 justify-between items-center gap-3">
          <div className="text-xs text-muted-foreground font-mono">ID: {invitation.id}</div>
          <div className="flex gap-2">
            {canCancel && onCancel && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  onClose();
                  onCancel();
                }}
                className="h-9 font-semibold"
              >
                Hủy lời mời
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 cursor-pointer font-semibold"
            >
              Đóng
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
