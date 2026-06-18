import PageContainer from '@/components/layout/page-container';
import { ContractManagementPage } from '@/features/admin/components/contract-management/page';

export const metadata = {
  title: 'Quản lý Hợp đồng | Admin',
  description: 'Theo dõi dòng tiền, xác nhận thanh toán phí, xử lý tranh chấp và bảo hành học thử.',
};

export default function AdminContractsPage() {
  return (
    <PageContainer
      pageTitle="Quản lý Hợp đồng"
      pageDescription="Giám sát trạng thái ký hợp đồng, theo dõi dòng tiền (phí nhận lớp), xử lý tranh chấp & hoàn phí."
    >
      <ContractManagementPage />
    </PageContainer>
  );
}
