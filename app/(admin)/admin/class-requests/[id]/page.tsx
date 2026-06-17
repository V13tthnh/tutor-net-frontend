import PageContainer from '@/components/layout/page-container';
import { ClassRequestDetailPage } from '@/features/admin/components/class-request-management/detail-page';

export const metadata = {
  title: 'Chi tiết yêu cầu lớp học | Admin',
  description: 'Chi tiết yêu cầu tìm gia sư và danh sách gia sư ứng tuyển',
};

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminClassRequestDetailPage(props: PageProps) {
  const { id } = await props.params;

  return (
    <PageContainer
      pageTitle={`Chi tiết yêu cầu lớp học #${id}`}
      pageDescription="Xem thông tin chi tiết lớp học và danh sách gia sư đã ứng tuyển."
    >
      <ClassRequestDetailPage classRequestId={Number(id)} />
    </PageContainer>
  );
}
