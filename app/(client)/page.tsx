import type { Metadata } from 'next';
import { HomePageClient } from '@/features/tutors/components/home-page-client';
import { getFeaturedTutors } from '@/features/tutors/api/service';

export const metadata: Metadata = {
  title: 'TutorNet - Nền tảng kết nối gia sư hàng đầu Việt Nam',
  description:
    'Tìm gia sư chất lượng cao, được xác minh trên toàn quốc. Học tại nhà, online hoặc kết hợp. Hơn 10,000 gia sư, 50,000+ học sinh.',
  keywords: [
    'gia sư',
    'tìm gia sư',
    'dạy kèm',
    'học thêm',
    'gia sư toán',
    'gia sư tiếng anh',
    'gia sư online',
    'TutorNet'
  ],
  openGraph: {
    title: 'TutorNet - Nền tảng kết nối gia sư hàng đầu Việt Nam',
    description: 'Tìm gia sư chất lượng cao, được xác minh trên toàn quốc.',
    type: 'website'
  }
};

export default async function HomePage() {
  // Prefetch featured tutors on server
  const featuredTutors = await getFeaturedTutors(6);

  return <HomePageClient featuredTutors={featuredTutors} />;
}
