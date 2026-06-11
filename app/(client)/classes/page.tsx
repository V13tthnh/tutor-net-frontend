import type { Metadata } from 'next';
import { PublicHeader } from '@/features/tutors/components/public-header';
import ClassListingPage from '@/features/classes/components/class-listing-page';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Tìm lớp học - TutorNet',
  description:
    'Khám phá danh sách lớp học cần tìm gia sư mới nhất. Lọc theo môn học, hình thức học tập và học phí đề xuất.',
  keywords: ['lớp học tìm gia sư', 'dạy kèm', 'tìm lớp dạy', 'gia sư dạy kèm', 'lớp học mới']
};

interface ClassesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default function ClassesPage({ searchParams }: ClassesPageProps) {
  return (
    <div className='min-h-screen bg-background text-foreground'>
      <PublicHeader />

      <main className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        {/* Page heading */}
        <div className='mb-8 space-y-2'>
          <h1 className='text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent'>
            Lớp học đang tìm gia sư
          </h1>
          <p className='text-muted-foreground text-base max-w-3xl leading-relaxed'>
            Xem danh sách yêu cầu tìm gia sư từ phụ huynh và học sinh. Đăng ký nhận lớp ngay để bắt đầu dạy học.
          </p>
        </div>

        <Suspense fallback={
          <div className='flex items-center justify-center min-h-[400px]'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
          </div>
        }>
          <ClassListingPage searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}
