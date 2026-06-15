import PageContainer from '@/components/layout/page-container';
import { TutorInvitationManagementPage } from '@/features/admin/components/tutor-invitation-management/page';

export const metadata = {
  title: 'Quản lý lời mời Gia sư | Admin',
  description: 'Xem và quản lý các lời mời đích danh giữa Phụ huynh và Gia sư',
};

export default function AdminTutorInvitationsPage() {
  return (
    <PageContainer
      pageTitle="Lời mời Gia sư"
      pageDescription="Thống kê và giám sát các lời mời đích danh trên nền tảng. Hủy lời mời khi phát hiện vi phạm quy định."
    >
      <TutorInvitationManagementPage />
    </PageContainer>
  );
}
