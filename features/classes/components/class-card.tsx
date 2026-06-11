'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { ClassRequest } from '../api/types';
import {
  IconMapPin,
  IconSchool,
  IconVideo,
  IconHome,
  IconUsers,
  IconClock,
  IconCalendarEvent,
  IconCoins,
  IconDeviceLaptop,
  IconNotes
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface ClassCardProps {
  classRequest: ClassRequest;
  onApplyClick?: (classRequest: ClassRequest) => void;
  onDetailClick?: (classRequest: ClassRequest) => void;
}

function TeachingModeBadge({ mode }: { mode: 'ONLINE' | 'OFFLINE' | 'HYBRID' }) {
  const icon =
    mode === 'ONLINE' ? (
      <IconVideo size={12} />
    ) : mode === 'OFFLINE' ? (
      <IconHome size={12} />
    ) : (
      <IconDeviceLaptop size={12} />
    );

  const label =
    mode === 'ONLINE'
      ? 'Online (Trực tuyến)'
      : mode === 'OFFLINE'
      ? 'Offline (Tại nhà)'
      : 'Onlive + Offline';

  const color =
    mode === 'ONLINE'
      ? 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800 dark:text-blue-400'
      : mode === 'OFFLINE'
      ? 'bg-green-500/10 text-green-600 border-green-200 dark:border-green-800 dark:text-green-400'
      : 'bg-violet-500/10 text-violet-600 border-violet-200 dark:border-violet-800 dark:text-violet-400';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {icon}
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'PENDING'
      ? 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800 dark:text-amber-400'
      : 'bg-muted text-muted-foreground border-border';

  const label = status === 'PENDING' ? 'Chờ gia sư' : status;

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${color}`}>
      {label}
    </span>
  );
}

export function ClassCard({ classRequest, onApplyClick, onDetailClick }: ClassCardProps) {
  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(classRequest.proposedPrice);

  const hourlyRateLabel = classRequest.hourlyRate
    ? `~ ${new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
      }).format(classRequest.hourlyRate)} / giờ`
    : null;

  const fullAddress = [classRequest.address, classRequest.ward, classRequest.province]
    .filter(Boolean)
    .join(', ');

  const timeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 60) return `Vừa xong`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      return `${diffDays} ngày trước`;
    } catch {
      return '';
    }
  };

  return (
    <Card className='group relative flex flex-col justify-between overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-card text-card-foreground h-full'>
      
      {/* Top Decoration Bar */}
      <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 to-primary/40' />

      {/* Main Info */}
      <div className='p-5 flex-1 flex flex-col gap-4'>
        {/* Header */}
        <div className='flex items-start justify-between gap-3'>
          <div className='space-y-1.5 min-w-0'>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant='default' className='bg-primary/95 text-primary-foreground font-semibold px-2.5 py-0.5 text-xs'>
                {classRequest.subjectName}
              </Badge>
              <StatusBadge status={classRequest.status} />
            </div>
            <h3 className='text-foreground font-bold text-base leading-snug group-hover:text-primary transition-colors line-clamp-1'>
              {classRequest.gradeLevel}
            </h3>
          </div>
        </div>

        {/* Proposed Price Box */}
        <div className='bg-primary/5 dark:bg-primary/10 rounded-xl p-3.5 border border-primary/10 flex flex-col gap-1'>
          <div className='flex items-center gap-1.5 text-xs text-muted-foreground font-medium'>
            <IconCoins size={14} className='text-primary' />
            Học phí đề xuất:
          </div>
          <div className='flex items-baseline gap-2 flex-wrap'>
            <span className='text-primary text-xl font-extrabold tracking-tight'>
              {formattedPrice}
            </span>
            <span className='text-muted-foreground text-xs font-normal'>
              / tháng
            </span>
          </div>
          {hourlyRateLabel && (
            <span className='text-[11px] text-muted-foreground font-medium'>
              {hourlyRateLabel}
            </span>
          )}
        </div>

        {/* Class Details Grid */}
        <div className='grid grid-cols-2 gap-3 text-xs border-b border-border/60 pb-3'>
          <div className='flex items-center gap-2 text-muted-foreground min-w-0'>
            <IconCalendarEvent size={15} className='text-muted-foreground/80 shrink-0' />
            <span className='truncate font-medium text-foreground'>{classRequest.sessionsPerWeek} buổi / tuần</span>
          </div>
          <div className='flex items-center gap-2 text-muted-foreground min-w-0'>
            <IconClock size={15} className='text-muted-foreground/80 shrink-0' />
            <span className='truncate font-medium text-foreground'>{classRequest.durationMinutes} phút / buổi</span>
          </div>
          <div className='flex items-center gap-2 text-muted-foreground min-w-0 col-span-2'>
            <IconMapPin size={15} className='text-muted-foreground/80 shrink-0' />
            <span className='truncate font-medium text-foreground'>{fullAddress}</span>
          </div>
        </div>

        {/* Student Notes */}
        <div className='space-y-1.5'>
          <div className='flex items-center gap-1.5 text-xs font-semibold text-foreground'>
            <IconNotes size={13} className='text-muted-foreground shrink-0' />
            Mô tả & Yêu cầu:
          </div>
          <p className='text-muted-foreground text-xs leading-relaxed line-clamp-3 italic bg-muted/30 p-2.5 rounded-lg border border-border/40'>
            "{classRequest.studentNotes || 'Không có mô tả chi tiết'}"
          </p>
        </div>

        {/* Mode and Meta */}
        <div className='flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40'>
          <TeachingModeBadge mode={classRequest.teachingMode} />
          <span className='text-muted-foreground text-[10px] font-medium'>
            Đăng {timeAgo(classRequest.createdAt)}
          </span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className='z-20 relative flex border-t bg-muted/20 px-5 py-4 shrink-0 gap-3'>
        <Button
          size='sm'
          variant='outline'
          className='flex-1 h-9 cursor-pointer hover:bg-muted font-semibold transition-colors'
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDetailClick?.(classRequest);
          }}
        >
          Xem chi tiết
        </Button>
        <Button
          size='sm'
          className='flex-1 h-9 cursor-pointer font-semibold shadow-sm hover:shadow transition-all'
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onApplyClick?.(classRequest);
          }}
        >
          Nhận lớp ngay
        </Button>
      </div>
    </Card>
  );
}
