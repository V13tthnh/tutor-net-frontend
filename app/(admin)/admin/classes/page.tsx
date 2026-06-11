import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { SessionListingPage } from '@/features/reviews/components/session-listing';

export const metadata = {
  title: 'TutorNet - Lớp học',
  description: 'Quản lý lịch học, học phí và đánh giá chất lượng gia sư.'
};

export default function Page() {
  return (
    <PageContainer
      pageTitle='Lớp học & Buổi học'
      pageDescription='Theo dõi lịch học, học phí và gửi đánh giá sau khi hoàn thành buổi học.'
      pageHeaderAction={
        <Button asChild variant='outline'>
          <Link href='/tutors'>
            <Icons.search className='h-4 w-4' />
            Tìm gia sư
          </Link>
        </Button>
      }
    >
      <SessionListingPage />

    </PageContainer>
  );
}
