import PageContainer from '@/components/layout/page-container';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import UserListingPage from '@/features/admin/components/user-listing';

export const metadata = { title: 'Admin: Quản trị viên' };
type PageProps = { searchParams: Promise<SearchParams> };

export default async function Page(props: PageProps) {
    const searchParams = await props.searchParams;
    searchParamsCache.parse(searchParams);

    return (
        <PageContainer
            pageTitle='Quản trị viên'
            pageDescription='Quản lý danh sách, vai trò và phân quyền tài khoản quản trị viên.'
            pageHeaderAction={
                <Link href='/admin/users/new'>
                    <Button>
                        <Icons.add className='h-4 w-4' /> Thêm quản trị viên
                    </Button>
                </Link>
            }
        >
            <UserListingPage />
        </PageContainer>
    );
}