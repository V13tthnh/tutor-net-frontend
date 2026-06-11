import PageContainer from '@/components/layout/page-container';
import { AdminReviewsPage } from '@/features/reviews/components/admin-reviews';

export const metadata = {
  title: 'TutorNet - Kiểm duyệt Đánh giá',
  description: 'Quản lý nhận xét và kiểm duyệt báo cáo vi phạm của gia sư.'
};

export default function Page() {
  return (
    <PageContainer
      pageTitle="Kiểm duyệt Đánh giá"
      pageDescription="Hệ thống tự động phát hiện từ ngữ nhạy cảm và lọc đánh giá điểm thấp. Admin duyệt công khai hoặc ẩn đánh giá."
    >
      <AdminReviewsPage />
    </PageContainer>
  );
}
