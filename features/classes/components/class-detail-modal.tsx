'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ClassRequest } from '../api/types';
import { IconX, IconCoins, IconCalendarEvent, IconClock, IconMapPin, IconUser, IconPhone, IconMail, IconNotes } from '@tabler/icons-react';

interface ClassDetailModalProps {
  classRequest: ClassRequest | null;
  open: boolean;
  onClose: () => void;
  onApply: (classRequest: ClassRequest) => void;
}

export function ClassDetailModal({ classRequest, open, onClose, onApply }: ClassDetailModalProps) {
  if (!classRequest) return null;

  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(classRequest.proposedPrice);

  const hourlyRateLabel = classRequest.hourlyRate
    ? new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
      }).format(classRequest.hourlyRate)
    : null;

  const fullAddress = [classRequest.address, classRequest.ward, classRequest.province]
    .filter(Boolean)
    .join(', ');

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className='flex w-[95vw] max-w-lg flex-col overflow-hidden rounded-xl border bg-background p-0 gap-0 shadow-2xl [&>button]:hidden animate-in fade-in-50 zoom-in-95 duration-200'
        hideCloseButton
      >
        <DialogTitle className='sr-only'>Chi tiết lớp học {classRequest.subjectName}</DialogTitle>

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
          <div className='border-b pb-4 space-y-2'>
            <div className='flex items-center gap-2'>
              <span className='bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full text-xs font-bold'>
                {classRequest.subjectName}
              </span>
              <span className='bg-amber-500/10 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase'>
                {classRequest.status === 'PENDING' ? 'Chờ gia sư' : classRequest.status}
              </span>
            </div>
            <h2 className='text-foreground font-extrabold text-xl leading-tight'>
              {classRequest.gradeLevel}
            </h2>
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
            {hourlyRateLabel && (
              <div className='space-y-1 sm:border-l sm:pl-4 border-primary/20'>
                <span className='text-xs text-muted-foreground font-semibold'>Tính theo giờ:</span>
                <p className='text-foreground text-sm font-bold'>{hourlyRateLabel} / giờ</p>
              </div>
            )}
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
                  <p className='text-sm font-semibold text-foreground mt-0.5'>{classRequest.sessionsPerWeek} buổi / tuần</p>
                </div>
              </div>

              <div className='flex items-start gap-2.5 min-w-0'>
                <IconClock size={18} className='text-muted-foreground shrink-0 mt-0.5' />
                <div>
                  <p className='text-[10px] font-bold text-muted-foreground uppercase'>Thời lượng học</p>
                  <p className='text-sm font-semibold text-foreground mt-0.5'>{classRequest.durationMinutes} phút / buổi</p>
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
                  <p className='text-sm font-semibold text-foreground mt-0.5'>{classRequest.contactName}</p>
                </div>
              </div>

              <div className='flex items-start gap-2.5 min-w-0'>
                <IconPhone size={18} className='text-muted-foreground shrink-0 mt-0.5' />
                <div>
                  <p className='text-[10px] font-bold text-muted-foreground uppercase'>Số điện thoại</p>
                  <p className='text-sm font-semibold text-foreground mt-0.5'>{classRequest.contactPhone || 'Chưa cập nhật'}</p>
                </div>
              </div>

              <div className='flex items-start gap-2.5 min-w-0 sm:col-span-2'>
                <IconMail size={18} className='text-muted-foreground shrink-0 mt-0.5' />
                <div>
                  <p className='text-[10px] font-bold text-muted-foreground uppercase'>Địa chỉ Email</p>
                  <p className='text-sm font-semibold text-foreground mt-0.5'>{classRequest.contactEmail || 'Chưa cập nhật'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Student Notes */}
          <div className='space-y-2'>
            <h3 className='text-sm font-bold text-foreground uppercase tracking-wider border-l-2 border-primary pl-2'>
              Yêu cầu khác từ học sinh
            </h3>
            <div className='flex items-start gap-3 bg-muted/40 p-4 rounded-xl border italic leading-relaxed text-sm text-foreground/90'>
              <IconNotes size={20} className='text-primary shrink-0 mt-0.5' />
              <span>"{classRequest.studentNotes || 'Không có yêu cầu chi tiết nào thêm.'}"</span>
            </div>
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
            Quay lại
          </Button>
          <Button
            type='button'
            onClick={() => {
              onApply(classRequest);
              onClose();
            }}
            className='h-10 cursor-pointer font-semibold'
          >
            Nhận dạy lớp này
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
