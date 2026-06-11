'use client';

import { useSearchParams } from 'next/navigation';
import { Icons } from '@/components/icons';

/**
 * Hiển thị banner cảnh báo khi user bị đẩy về trang đăng nhập vì hết hạn phiên.
 * Đọc ?reason=expired từ URL — được set bởi api-client khi gặp 401.
 */
export function SessionExpiredBanner() {
  const params = useSearchParams();
  if (params.get('reason') !== 'expired') return null;

  return (
    <div className='mb-4 flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300'>
      <Icons.warning className='mt-0.5 h-4 w-4 shrink-0' />
      <span>
        <span className='font-semibold'>Phiên đăng nhập đã hết hạn.</span> Vui lòng đăng nhập lại để tiếp tục.
      </span>
    </div>
  );
}
