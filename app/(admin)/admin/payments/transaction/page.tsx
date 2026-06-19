import PageContainer from '@/components/layout/page-container';
import { TransactionManagementPage } from '@/features/admin/components/transaction-management/page';

export const metadata = {
  title: 'Quản lý Giao dịch | Admin',
  description: 'Giám sát dòng tiền, doanh thu đóng phí nhận lớp của gia sư, đối soát giao dịch.',
};

export default function AdminTransactionsPage() {
  return (
    <PageContainer
      pageTitle="Quản lý Giao dịch"
      pageDescription="Tra cứu lịch sử thanh toán, doanh thu phí nhận lớp của gia sư qua VNPay, PayOS và Chuyển khoản."
    >
      <TransactionManagementPage />
    </PageContainer>
  );
}
