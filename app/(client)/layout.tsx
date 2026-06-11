import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TutorNet - Nền tảng kết nối gia sư',
  description:
    'Tìm gia sư chất lượng cao trên toàn quốc. Hơn 1000+ gia sư được xác minh với nhiều môn học, cấp độ và khu vực khác nhau.',
  keywords: ['gia sư', 'tìm gia sư', 'dạy kèm', 'học thêm', 'giáo viên'],
  robots: {
    index: true,
    follow: true
  }
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
