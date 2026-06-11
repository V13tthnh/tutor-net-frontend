import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { ClassRequestManagementPage } from '@/features/admin/components/class-request-management/page';
import { Link } from 'lucide-react';
import { Icons } from '@/components/icons';

export const metadata = {
  title: 'Quản lý yêu cầu lớp học | Admin',
  description: 'Quản lý và xử lý các yêu cầu lớp học từ học sinh',
};

export default function AdminClassRequestsPage() {
  return (<PageContainer
    pageTitle='Lớp học & Buổi học'
    pageDescription='Theo dõi lịch học, học phí và gửi đánh giá sau khi hoàn thành buổi học.'
    pageHeaderAction={
      <Button asChild variant='outline'>
        <Link href='/tutors'>
          <Icons.search className='h-4 w-4' />
          Xuất pdf
        </Link>
      </Button>
    }
  >
    <ClassRequestManagementPage />
  </PageContainer>);
}
