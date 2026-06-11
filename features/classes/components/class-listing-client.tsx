'use client';

import { useState } from 'react';
import { ClassFilters } from './class-filters';
import { ClassGrid } from './class-grid';
import { ClassDetailModal } from './class-detail-modal';
import type { ClassFilters as ClassFiltersType, ClassRequest } from '../api/types';
import { toast } from 'sonner';

interface ClassListingClientProps {
  filters: ClassFiltersType;
}

export function ClassListingClient({ filters }: ClassListingClientProps) {
  const [detailClass, setDetailClass] = useState<ClassRequest | null>(null);

  const handleApplyClass = (classRequest: ClassRequest) => {
    toast.success(
      `Đã gửi yêu cầu ứng tuyển dạy lớp "${classRequest.gradeLevel} - Môn ${classRequest.subjectName}" thành công! Hệ thống sẽ liên hệ với bạn trong thời gian sớm nhất.`
    );
  };

  return (
    <div className='space-y-6'>
      <ClassFilters />
      
      <ClassGrid
        filters={filters}
        onApplyClick={handleApplyClass}
        onDetailClick={(cls) => setDetailClass(cls)}
      />

      <ClassDetailModal
        classRequest={detailClass}
        open={detailClass !== null}
        onClose={() => setDetailClass(null)}
        onApply={handleApplyClass}
      />
    </div>
  );
}
