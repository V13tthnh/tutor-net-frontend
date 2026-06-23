import PageContainer from '@/components/layout/page-container';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import RolesListingPage from '@/features/roles/components/roles-listing';

export const metadata = { title: 'Admin: Quản lý vai trò' };
type PageProps = { searchParams: Promise<SearchParams> };

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      pageTitle='Quản lý vai trò'
      pageDescription='Quản lý vai trò và quyền hạn'
      pageHeaderAction={
        <Link href="/admin/roles/new">
          <Button>
            <Icons.add className="mr-2 h-4 w-4" /> Thêm Vai trò
          </Button>
        </Link>
      }
    >
      <RolesListingPage />
    </PageContainer>
  );
}
