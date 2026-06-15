import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import {
  IconChevronRight,
  IconSearch,
  IconShieldCheck,
  IconClockHour4,
} from '@tabler/icons-react';
import { PublicHeader } from '@/features/tutors/components/public-header';
import PublicFooter from '@/features/tutors/components/public-footer';
import TrackClassPage from '@/features/classes/components/track-class-page';

export const metadata: Metadata = {
  title: 'Tra cứu trạng thái lớp học - TutorNet',
  description:
    'Tra cứu nhanh trạng thái yêu cầu tìm gia sư của bạn trên TutorNet. Nhập mã lớp và số điện thoại để xem tiến trình xử lý, số lượng gia sư ứng tuyển và thông tin ghép đôi.',
  keywords: [
    'tra cứu lớp học',
    'kiểm tra trạng thái gia sư',
    'theo dõi yêu cầu tìm gia sư',
    'TutorNet tracking',
  ],
};

const INFO_PILLS = [
  {
    icon: <IconShieldCheck size={15} className='text-primary' />,
    text: 'Bảo mật thông tin',
  },
  {
    icon: <IconClockHour4 size={15} className='text-primary' />,
    text: 'Cập nhật theo thời gian thực',
  },
  {
    icon: <IconSearch size={15} className='text-primary' />,
    text: 'Không cần đăng nhập',
  },
];

export default function TrackClassRoutePage() {
  return (
    <div className='min-h-screen bg-muted/20 text-foreground'>
      <PublicHeader />

      <main className='mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8'>
        {/* Breadcrumb */}
        <nav className='mb-6 flex items-center gap-1.5 text-xs text-muted-foreground'>
          <Link href='/' className='hover:text-primary transition-colors'>
            Trang chủ
          </Link>
          <IconChevronRight size={12} />
          <Link href='/classes' className='hover:text-primary transition-colors'>
            Danh sách lớp
          </Link>
          <IconChevronRight size={12} />
          <span className='text-foreground font-medium'>Tra cứu lớp học</span>
        </nav>

        {/* Page Header */}
        <div className='mb-8 text-center'>
          <div className='inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-1.5 text-sm font-semibold mb-4'>
            <IconSearch size={15} />
            Tra cứu trạng thái
          </div>

          <h1 className='text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3 leading-tight'>
            Theo dõi{' '}
            <span className='bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent'>
              yêu cầu lớp học
            </span>
          </h1>

          <p className='text-muted-foreground text-base max-w-lg mx-auto leading-relaxed'>
            Nhập mã lớp và số điện thoại đăng ký để xem tiến trình tìm gia sư của bạn.
          </p>

          {/* Info Pills */}
          <div className='flex flex-wrap items-center justify-center gap-3 mt-5'>
            {INFO_PILLS.map((pill, i) => (
              <div
                key={i}
                className='flex items-center gap-1.5 text-sm text-muted-foreground bg-background border rounded-full px-3 py-1.5 shadow-sm'
              >
                {pill.icon}
                {pill.text}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Suspense
          fallback={
            <div className='flex items-center justify-center min-h-[300px]'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary' />
            </div>
          }
        >
          <TrackClassPage />
        </Suspense>
      </main>

      <PublicFooter />
    </div>
  );
}
