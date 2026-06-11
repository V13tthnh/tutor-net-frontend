import PageContainer from '@/components/layout/page-container';
import UserViewPage from '@/features/admin/components/user-view-page';

export const metadata = { title: 'Admin: Quản lý quản trị viên' };
type PageProps = { params: Promise<{ id: string }> };

export default async function Page(props: PageProps) {
  const { id } = await props.params;
  const isCreate = id === 'new';

  return (
    <PageContainer
      pageTitle={isCreate ? 'Tạo tài khoản quản trị viên' : 'Chỉnh sửa tài khoản quản trị viên'}
      pageDescription={isCreate ? 'Tạo tài khoản quản trị viên mới và gán vai trò RBAC.' : 'Cập nhật thông tin, ảnh đại diện và mật khẩu của quản trị viên.'}
    >
      <UserViewPage userId={id} />
    </PageContainer>
  );
}
