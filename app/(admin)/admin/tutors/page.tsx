import PageContainer from '@/components/layout/page-container';
import { TutorManagementTable } from '@/features/admin/components/tutor-management/tutor-management-table';

export const metadata = { title: 'Quản lý Gia sư | TutorNet Admin' };

export default function TutorsPage() {
    return (
        <PageContainer
            pageTitle='Quản lý Gia sư'
            pageDescription='Duyệt hồ sơ, xem CV và quản lý trạng thái gia sư trong hệ thống.'
        >
            <TutorManagementTable />
        </PageContainer>
    );
}