import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import CvReviewManagementPage from '@/features/cv-reviews/components/cv-review-management-page';

export const metadata = {
  title: 'Dashboard: Review CVs',
  description: 'Quản lý hồ sơ gia sư đang chờ duyệt.'
};

export default function Page() {
  return (
    <PageContainer
      pageTitle='Review CVs'
      pageDescription='Duyệt hồ sơ gia sư, kiểm tra bằng cấp và phân luồng các CV cần bổ sung.'
      pageHeaderAction={
        <Button variant='outline'>
          <Icons.fileTypeXls className='h-4 w-4' />
          Xuất danh sách
        </Button>
      }
    >
      <CvReviewManagementPage />
    </PageContainer>
  );
}
