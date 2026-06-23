'use client';

import { useState } from 'react';
import { ClassFilters } from './class-filters';
import { ClassGrid } from './class-grid';
import { ClassDetailModal } from './class-detail-modal';
import { ClassApplyModal } from './class-apply-modal';
import type { ClassFilters as ClassFiltersType, ClassRequest } from '../api/types';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { applyForClassRequest } from '../api/service';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

interface ClassListingClientProps {
  filters: ClassFiltersType;
}

export function ClassListingClient({ filters }: ClassListingClientProps) {
  const [detailClass, setDetailClass] = useState<ClassRequest | null>(null);
  const [applyClass, setApplyClass] = useState<ClassRequest | null>(null);
  const { user } = useAuthSession();

  const handleApplyClick = async (classRequest: ClassRequest) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để ứng tuyển nhận lớp!', {
        description: 'Bạn cần có tài khoản Gia sư để ứng tuyển.',
        action: {
          label: 'Đăng nhập',
          onClick: () => {
            window.location.href = '/auth/login';
          },
        },
      });
      return;
    }

    if (!user.roles?.includes('tutor')) {
      toast.error('Chỉ Gia sư mới được phép ứng tuyển nhận lớp!', {
        description: 'Vui lòng đăng ký làm gia sư và đợi phê duyệt hồ sơ.',
        action: {
          label: 'Đăng ký Gia sư',
          onClick: () => {
            window.location.href = `/account/new-cv`;
          },
        },
      });
      return;
    }

    const toastId = toast.loading('Đang kiểm tra trạng thái hồ sơ gia sư...');

    try {
      const profile = await apiClient<any>('/tutor/profile/me');
      const status = profile?.status || profile?.data?.status;

      if (status !== 'APPROVED') {
        toast.error('Hồ sơ gia sư của bạn chưa được phê duyệt!', {
          id: toastId,
          description: 'Vui lòng đợi ban quản trị duyệt hồ sơ trước khi nhận lớp.',
          action: {
            label: 'Xem hồ sơ',
            onClick: () => {
              window.location.href = '/account/new-cv';
            },
          },
        });
        return;
      }

      toast.dismiss(toastId);
      setApplyClass(classRequest);
    } catch (err: any) {
      console.error(err);
      const isNotFound = err.message?.includes('404') || err.message?.toLowerCase().includes('không tìm thấy');
      if (isNotFound) {
        toast.error('Không tìm thấy hồ sơ gia sư của bạn!', {
          id: toastId,
          description: 'Vui lòng tạo hồ sơ gia sư trước khi nhận lớp.',
          action: {
            label: 'Tạo hồ sơ',
            onClick: () => {
              window.location.href = '/account/new-cv';
            },
          },
        });
      } else {
        toast.error(err.message || 'Không thể xác thực hồ sơ gia sư. Vui lòng thử lại sau.', {
          id: toastId,
        });
      }
    }
  };

  const handleApplySubmit = async (classRequestId: number, message: string) => {
    try {
      const res = await applyForClassRequest(classRequestId, message);
      toast.success(
        res.message || 'Ứng tuyển thành công! Phụ huynh đã được thông báo và sẽ phản hồi sớm nhất.'
      );
      setApplyClass(null);
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra khi ứng tuyển. Vui lòng thử lại.');
      throw err; // Re-throw to keep submitting state in modal
    }
  };

  return (
    <div className='space-y-6'>
      <ClassFilters />
      
      <ClassGrid
        filters={filters}
        onApplyClick={handleApplyClick}
        onDetailClick={(cls) => setDetailClass(cls)}
      />

      <ClassDetailModal
        classRequest={detailClass}
        open={detailClass !== null}
        onClose={() => setDetailClass(null)}
        onApply={handleApplyClick}
      />

      <ClassApplyModal
        classRequest={applyClass}
        open={applyClass !== null}
        onClose={() => setApplyClass(null)}
        onSubmit={handleApplySubmit}
      />
    </div>
  );
}
