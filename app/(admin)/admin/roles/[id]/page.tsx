import PageContainer from '@/components/layout/page-container';
import RoleViewPage from '@/features/roles/components/role-view-page';
import dynamic from 'next/dynamic';

export const metadata = { title: 'Admin: Role Details' };
type PageProps = { params: Promise<{ id: string }> };

export default async function Page(props: PageProps) {
  const { id } = await props.params;
  const isCreate = id === 'new';

  return (
    <PageContainer
      pageTitle={isCreate ? 'Create Role' : 'Edit Role'}

    >
      <RoleViewPage roleId={id} />
    </PageContainer>
  );
}
