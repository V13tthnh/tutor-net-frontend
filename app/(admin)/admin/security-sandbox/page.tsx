// app/(admin)/admin/securities/page.tsx
import type { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { SecuritySandboxClient } from '@/features/security-sandbox/components/security-sandbox-client';

export const metadata: Metadata = {
  title: 'Security Sandbox — TutorNet Admin',
  description: 'Mô phỏng và kiểm thử các lỗ hổng bảo mật trong môi trường sandbox an toàn.',
  robots: { index: false, follow: false },
};

export default function SecuritiesPage() {
  return (
    <PageContainer
      pageTitle="Security Sandbox"
      pageDescription="Bật/tắt 22 lỗ hổng bảo mật để mô phỏng và kiểm thử trên giao diện hiện tại. Chỉ dùng trong môi trường phát triển."
    >
      <SecuritySandboxClient />
    </PageContainer>
  );
}
