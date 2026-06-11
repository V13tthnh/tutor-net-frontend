import PageContainer from '@/components/layout/page-container';
import SubjectsManagementClient from '@/features/subjects/components/subjects-management';

export const metadata = {
  title: 'Dashboard: Quản lý Môn học',
  description: 'Quản lý cây cấu trúc môn học, thêm mới và kéo thả sắp xếp.'
};

export default function Page() {
  return (
    <PageContainer
      pageTitle='Quản lý Môn học'
      pageDescription='Cây cấu trúc môn học theo cấp bậc. Kéo thả để sắp xếp. Bấm môn học để chọn làm nhóm cha khi thêm mới.'
    >
      <SubjectsManagementClient />
    </PageContainer>
  );
}
