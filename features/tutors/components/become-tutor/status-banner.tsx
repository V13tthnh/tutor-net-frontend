'use client';

import { IconCheck, IconClock, IconAlertCircle, IconInfoCircle, IconArrowRight } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface StatusBannerProps {
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  rejectionReason?: string | null;
  onResubmitClick?: () => void;
}

export function StatusBanner({ status, rejectionReason, onResubmitClick }: StatusBannerProps) {
  if (status === 'DRAFT') {
    return null;
  }

  const statusConfig = {
    PENDING_REVIEW: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800',
      icon: 'bg-amber-100 text-amber-600',
      title: 'Hồ sơ đang chờ xét duyệt',
      description: 'Hồ sơ của bạn đang trong quá trình đối soát chứng chỉ. Toàn bộ chức năng chỉnh sửa tạm thời đóng băng cho đến khi có kết quả duyệt. Chúng tôi sẽ phản hồi trong vòng 1-3 ngày làm việc.',
      icon_element: <IconClock size={18} />,
    },
    APPROVED: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: 'bg-emerald-100 text-emerald-600',
      title: 'Hồ sơ đã được phê duyệt và công khai',
      description: 'Hồ sơ của bạn đã hoạt động. Hệ thống cho phép bạn cập nhật linh hoạt Lịch rảnh, Khu vực và Bio giới thiệu. Chức năng sửa Môn học & Bằng cấp đã được niêm phong để bảo mật.',
      icon_element: <IconCheck size={18} />,
    },
    REJECTED: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800',
      icon: 'bg-red-100 text-red-600',
      title: 'Hồ sơ bị từ chối phê duyệt',
      description: rejectionReason
        ? `Hồ sơ chưa đạt yêu cầu: ${rejectionReason}. Vui lòng chỉnh sửa toàn bộ thông tin (bao gồm cả giấy tờ, bằng cấp) để gửi yêu cầu duyệt lại.`
        : 'Hồ sơ chưa đạt yêu cầu hệ thống. Bạn được quyền sửa đổi toàn bộ thông tin (bao gồm cả giấy tờ, bằng cấp) để gửi yêu cầu duyệt lại.',
      icon_element: <IconAlertCircle size={18} />,
    },
    SUSPENDED: {
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      border: 'border-orange-200 dark:border-orange-800',
      icon: 'bg-orange-100 text-orange-600',
      title: 'Tài khoản đang bị đình chỉ',
      description: 'Tài khoản của bạn tạm thời bị đình chỉ. Vui lòng liên hệ với ban quản trị để biết thêm chi tiết.',
      icon_element: <IconAlertCircle size={18} />,
    },
  };

  const config = statusConfig[status];

  return (
    <div className={cn(
      'rounded-2xl border px-5 py-4 flex items-start gap-3 shadow-sm animate-in fade-in duration-300',
      config.bg,
      config.border
    )}>
      <div className={cn(
        'mt-0.5 flex h-8 w-8 items-center justify-center rounded-full shrink-0 shadow-sm',
        config.icon
      )}>
        {config.icon_element}
      </div>
      <div className='flex-1'>
        <p className='text-sm font-bold text-foreground'>
          {config.title}
        </p>
        <p className='text-xs mt-1 leading-relaxed text-muted-foreground'>
          {config.description}
        </p>
        {status === 'REJECTED' && onResubmitClick && (
          <div className='mt-3'>
            <Button
              size='sm'
              variant='default'
              onClick={onResubmitClick}
              className='gap-1 h-8 text-xs font-semibold'
            >
              Sẵn sàng để nộp lại
              <IconArrowRight size={14} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
