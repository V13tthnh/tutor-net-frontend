'use client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { IconX, IconCoins, IconCalendarEvent, IconClock, IconMapPin, IconUser, IconPhone, IconMail, IconNotes } from '@tabler/icons-react';
import type { ClassRequestResponse } from '../../api/types';

interface ClassRequestDetailModalProps {
  request: ClassRequestResponse | null;
  open: boolean;
  onClose: () => void;
}

export function ClassRequestDetailModal({ request, open, onClose }: ClassRequestDetailModalProps) {
  if (!request) return null;

  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(request.proposedPrice);

  const teachingModeLabel = {
    ONLINE: 'Online',
    OFFLINE: 'Tại nhà',
    HYBRID: 'Kết hợp'
  }[request.teachingMode] || request.teachingMode;

  const fullAddress = request.addressDetail || 'Chưa cập nhật';

  const statusLabel = {
    PENDING: 'Chờ duyệt',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Từ chối',
    CANCELLED: 'Hủy'
  }[request.status] || request.status;

  const statusColor = {
    PENDING: 'bg-amber-500/10 text-amber-600 border-amber-200',
    APPROVED: 'bg-green-500/10 text-green-600 border-green-200',
    REJECTED: 'bg-red-500/10 text-red-600 border-red-200',
    CANCELLED: 'bg-gray-500/10 text-gray-600 border-gray-200'
  }[request.status] || 'bg-primary/10 text-primary border-primary/20';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className='flex w-[95vw] max-w-lg flex-col overflow-hidden rounded-xl border bg-background p-0 gap-0 shadow-2xl [&>button]:hidden animate-in fade-in-50 zoom-in-95 duration-200'
        hideCloseButton
      >
        <DialogTitle className='sr-only'>Chi tiết yêu cầu lớp học #{request.id}</DialogTitle>

        {/* Header */}
        <header className='flex shrink-0 items-center justify-between px-6 py-4 bg-primary text-primary-foreground'>
          <span className='font-bold text-base tracking-wide uppercase'>
            Chi tiết yêu cầu tìm Gia sư
          </span>
          <button
            type='button'
            onClick={onClose}
            aria-label='Đóng'
            className='rounded-full p-1.5 transition-colors hover:bg-primary-foreground/10 text-primary-foreground cursor-pointer'
          >
            <IconX size={18} />
          </button>
        </header>

        {/* Body */}
        <div className='p-6 space-y-6 overflow-y-auto max-h-[80vh]'>

          {/* Main info card */}
          <div className='border-b pb-4 space-y-3'>
            <div className='flex items-center gap-2 flex-wrap'>
              <span className='bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full text-xs font-bold'>
                {request.subjectName}
              </span>
              <span className={`${statusColor} border px-2 py-0.5 rounded-md text-[10px] font-bold uppercase`}>
                {statusLabel}
              </span>
              <span className='text-[10px] font-mono text-muted-foreground'>ID: {request.id}</span>
            </div>
            <h2 className='text-foreground font-extrabold text-lg leading-tight'>
              {request.gradeLevel}
            </h2>
            {request.rejectionReason && (
              <div className='bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 rounded-lg'>
                <p className='text-xs font-semibold text-red-700 dark:text-red-400 mb-1'>Lý do từ chối:</p>
                <p className='text-sm text-red-600 dark:text-red-300'>{request.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* Pricing Box */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 bg-primary/5 dark:bg-primary/10 p-4 rounded-xl border border-primary/10'>
            <div className='space-y-1'>
              <span className='flex items-center gap-1.5 text-xs text-muted-foreground font-semibold'>
                <IconCoins size={14} className='text-primary' />
                Học phí đề xuất:
              </span>
              <div className='flex items-baseline gap-1.5'>
                <span className='text-primary text-lg font-extrabold'>{formattedPrice}</span>
                <span className='text-muted-foreground text-xs'>/ tháng</span>
              </div>
            </div>
            <div className='space-y-1 sm:border-l sm:pl-4 border-primary/20'>
              <span className='text-xs text-muted-foreground font-semibold'>Hình thức dạy:</span>
              <p className='text-foreground text-sm font-bold'>{teachingModeLabel}</p>
            </div>
          </div>

          {/* Details Table */}
          <div className='space-y-3.5'>
            <h3 className='text-sm font-bold text-foreground uppercase tracking-wider border-l-2 border-primary pl-2'>
              Thông tin chi tiết lớp học
            </h3>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border'>
              <div className='flex items-start gap-2.5 min-w-0'>
                <IconCalendarEvent size={18} className='text-muted-foreground shrink-0 mt-0.5' />
                <div>
                  <p className='text-[10px] font-bold text-muted-foreground uppercase'>Số buổi học</p>
                  <p className='text-sm font-semibold text-foreground mt-0.5'>{request.sessionsPerWeek} buổi / tuần</p>
                </div>
              </div>

              <div className='flex items-start gap-2.5 min-w-0'>
                <IconClock size={18} className='text-muted-foreground shrink-0 mt-0.5' />
                <div>
                  <p className='text-[10px] font-bold text-muted-foreground uppercase'>Thời lượng học</p>
                  <p className='text-sm font-semibold text-foreground mt-0.5'>{request.durationMinutes} phút / buổi</p>
                </div>
              </div>

              <div className='flex items-start gap-2.5 min-w-0 sm:col-span-2'>
                <IconMapPin size={18} className='text-muted-foreground shrink-0 mt-0.5' />
                <div>
                  <p className='text-[10px] font-bold text-muted-foreground uppercase'>Địa chỉ học tập</p>
                  <p className='text-sm font-semibold text-foreground mt-0.5'>{fullAddress}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className='space-y-3.5'>
            <h3 className='text-sm font-bold text-foreground uppercase tracking-wider border-l-2 border-primary pl-2'>
              Thông tin người liên hệ
            </h3>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border'>
              <div className='flex items-start gap-2.5 min-w-0'>
                <IconUser size={18} className='text-muted-foreground shrink-0 mt-0.5' />
                <div>
                  <p className='text-[10px] font-bold text-muted-foreground uppercase'>Người liên hệ</p>
                  <p className='text-sm font-semibold text-foreground mt-0.5'>{request.contactName}</p>
                </div>
              </div>

              <div className='flex items-start gap-2.5 min-w-0'>
                <IconPhone size={18} className='text-muted-foreground shrink-0 mt-0.5' />
                <div>
                  <p className='text-[10px] font-bold text-muted-foreground uppercase'>Số điện thoại</p>
                  <p className='text-sm font-semibold text-foreground mt-0.5'>{request.contactPhone || 'Chưa cập nhật'}</p>
                </div>
              </div>

              <div className='flex items-start gap-2.5 min-w-0 sm:col-span-2'>
                <IconMail size={18} className='text-muted-foreground shrink-0 mt-0.5' />
                <div>
                  <p className='text-[10px] font-bold text-muted-foreground uppercase'>Địa chỉ Email</p>
                  <p className='text-sm font-semibold text-foreground mt-0.5'>{request.contactEmail || 'Chưa cập nhật'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Student Notes */}
          {request.studentNotes && (
            <div className='space-y-2'>
              <h3 className='text-sm font-bold text-foreground uppercase tracking-wider border-l-2 border-primary pl-2'>
                Yêu cầu khác từ học sinh
              </h3>
              <div className='flex items-start gap-3 bg-muted/40 p-4 rounded-xl border italic leading-relaxed text-sm text-foreground/90'>
                <IconNotes size={20} className='text-primary shrink-0 mt-0.5' />
                <span>"{request.studentNotes}"</span>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className='space-y-2 text-xs text-muted-foreground border-t pt-4'>
            <p>Tạo lúc: {new Date(request.createdAt).toLocaleString('vi-VN')}</p>
            <p>Cập nhật lúc: {new Date(request.updatedAt).toLocaleString('vi-VN')}</p>
          </div>
        </div>

        {/* Footer */}
        <footer className='flex border-t bg-muted/20 px-6 py-4 shrink-0 justify-end gap-3'>
          <Button
            type='button'
            variant='outline'
            onClick={onClose}
            className='h-10 cursor-pointer font-semibold'
          >
            Đóng
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
