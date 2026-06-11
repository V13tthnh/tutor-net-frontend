import type { Metadata } from 'next';
import { PublicHeader } from '@/features/tutors/components/public-header';
import PublicFooter from '@/features/tutors/components/public-footer';
import PostClassPage from '@/features/classes/components/post-class-page';
import { Suspense } from 'react';
import Link from 'next/link';
import {
  IconClockHour4,
  IconShieldCheck,
  IconUsers,
  IconChevronRight,
} from '@tabler/icons-react';

export const metadata: Metadata = {
  title: 'Đăng lớp tìm gia sư - TutorNet',
  description:
    'Đăng yêu cầu tìm gia sư miễn phí tại TutorNet. Không cần đăng nhập — chỉ điền thông tin và nhận kết nối gia sư phù hợp trong 24 giờ.',
  keywords: ['đăng lớp tìm gia sư', 'tìm gia sư', 'đăng ký học', 'tìm gia sư miễn phí']
};

const FEATURES = [
  { icon: <IconShieldCheck size={20} className='text-primary' />, text: 'Hoàn toàn miễn phí' },
  { icon: <IconClockHour4 size={20} className='text-primary' />, text: 'Phản hồi trong 24h' },
  { icon: <IconUsers size={20} className='text-primary' />, text: 'Hàng nghìn gia sư chất lượng' },
];

export default function PostClassRoutePage() {
  return (
    <div className='min-h-screen bg-muted/20 text-foreground'>
      <PublicHeader />

      <main className='mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8'>
        {/* Breadcrumb */}
        <nav className='mb-6 flex items-center gap-1.5 text-xs text-muted-foreground'>
          <Link href='/' className='hover:text-primary transition-colors'>Trang chủ</Link>
          <IconChevronRight size={12} />
          <Link href='/classes' className='hover:text-primary transition-colors'>Danh sách lớp</Link>
          <IconChevronRight size={12} />
          <span className='text-foreground font-medium'>Đăng lớp tìm gia sư</span>
        </nav>

        {/* Page Header */}
        <div className='mb-8 text-center'>
          <div className='inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-1.5 text-sm font-semibold mb-4'>
            <IconUsers size={16} />
            Dành cho Phụ huynh & Học sinh
          </div>
          <h1 className='text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3 leading-tight'>
            Đăng lớp tìm{' '}
            <span className='bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent'>
              gia sư phù hợp
            </span>
          </h1>
          <p className='text-muted-foreground text-base max-w-xl mx-auto leading-relaxed'>
            Điền thông tin một lần — đăng ký nhiều môn cùng lúc. Gia sư sẽ chủ động liên hệ bạn.
          </p>

          {/* Feature Pills */}
          <div className='flex flex-wrap items-center justify-center gap-3 mt-5'>
            {FEATURES.map((f, i) => (
              <div key={i} className='flex items-center gap-1.5 text-sm text-muted-foreground bg-background border rounded-full px-3 py-1.5 shadow-sm'>
                {f.icon}
                {f.text}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <Suspense fallback={
          <div className='flex items-center justify-center min-h-[400px]'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary' />
          </div>
        }>
          <PostClassPage />
        </Suspense>
      </main>

      <PublicFooter />
    </div>
  );
}
