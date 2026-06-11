import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { InfoSidebar } from '@/components/layout/info-sidebar';
import { InfobarProvider } from '@/components/ui/infobar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getServerSession } from '@/features/auth/lib/session.server';

export const metadata: Metadata = {
  title: 'TutorNet Admin',
  description: 'TutorNet Administration Dashboard',
  robots: {
    index: false,
    follow: false
  }
};

import { redirect } from 'next/navigation';
import { AUTH_CONFIG } from '@/features/auth/lib/auth.config';
import { headers } from 'next/headers';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = await getServerSession();

  if (!session) {
    const headerList = await headers();
    const pathname = headerList.get('x-pathname') || '/admin/dashboard';
    const next = encodeURIComponent(pathname);
    redirect(`${AUTH_CONFIG.ROUTES.ADMIN.LOGIN}?next=${next}&reason=expired`);
  }

  // Default values or session values
  const userName = session.user.fullName;
  const userAvatar = session.user.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin';

  // Persisting the sidebar state in the cookie.
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  return (
    <>
      {/* <script
        dangerouslySetInnerHTML={{
          __html:
            `try{localStorage.setItem('active_role','ADMIN');localStorage.setItem('active_user_id','999');localStorage.setItem('active_user_name',${JSON.stringify(userName)});localStorage.setItem('active_user_avatar',${JSON.stringify(userAvatar)})}catch(_){ }`
        }}
      /> */}
      <KBar>
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar adminId={session.user.id} adminName={userName} adminAvatar={userAvatar} />
          <SidebarInset>
            <Header />
            <InfobarProvider defaultOpen={false}>
              {children}
              <InfoSidebar side='right' />
            </InfobarProvider>
          </SidebarInset>
        </SidebarProvider>
      </KBar>
    </>
  );
}
