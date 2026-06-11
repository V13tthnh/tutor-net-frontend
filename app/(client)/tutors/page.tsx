import type { Metadata } from 'next';
import { PublicHeader } from '@/features/tutors/components/public-header';
import TutorsListingPage from '@/features/tutors/components/tutor-listing-page';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Tìm gia sư - TutorNet',
  description:
    'Khám phá hàng nghìn gia sư chất lượng cao. Lọc theo môn học, cấp độ, tỉnh thành, giới tính và hình thức dạy học.',
  keywords: ['tìm gia sư', 'gia sư toán', 'gia sư tiếng anh', 'dạy kèm tại nhà', 'gia sư online']
};

interface TutorsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default function TutorsPage({ searchParams }: TutorsPageProps) {
  return (
    <div className='min-h-screen'>
      <PublicHeader />

      <main className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        {/* Page heading */}
        <div className='mb-8'>
          <h1 className='text-foreground text-3xl font-bold tracking-tight'>Tìm gia sư</h1>
          <p className='text-muted-foreground mt-2 text-base'>
            Khám phá gia sư phù hợp với nhu cầu của bạn — lọc theo môn học, khu vực, hình thức và
            học phí.
          </p>
        </div>

        <Suspense>
          <TutorsListingPage searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}
