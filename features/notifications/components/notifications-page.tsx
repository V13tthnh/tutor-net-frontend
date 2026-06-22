'use client';

import { useState, useEffect, useRef } from 'react';
import { Icons } from '@/components/icons';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { NotificationCard } from '@/components/ui/notification-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { useNotificationStore } from '../utils/store';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';

export default function NotificationsPage() {
  const { user } = useAuthSession();
  const router = useRouter();

  const {
    historyNotifications,
    historyHasMore,
    historyLoading,
    fetchHistory,
    markAsRead,
    markAllAsRead,
    unreadCount
  } = useNotificationStore();

  const count = unreadCount();
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Map tab name to API filter value: 'all' -> null, 'unread' -> false, 'read' -> true
  const getFilterValue = (tab: typeof activeTab): boolean | null => {
    if (tab === 'unread') return false;
    if (tab === 'read') return true;
    return null;
  };

  const currentFilter = getFilterValue(activeTab);

  // Fetch initial page when token or active tab changes
  useEffect(() => {
    if (user) {
      fetchHistory(currentFilter, true);
    }
  }, [user, activeTab, fetchHistory]);

  // Infinite scroll intersection observer
  useEffect(() => {
    const currentTarget = loadMoreRef.current;
    if (!currentTarget || !user) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && historyHasMore && !historyLoading) {
          fetchHistory(currentFilter, false);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentTarget);

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [user, historyHasMore, historyLoading, activeTab, fetchHistory]);

  const handleAction = async (notifId: string, actionId: string) => {
    const notif = historyNotifications.find((n) => n.id === notifId);
    if (notif?.redirectUrl) {
      await markAsRead(notifId);
      router.push(notif.redirectUrl);
    }
  };

  const renderList = () => {
    if (historyNotifications.length === 0 && !historyLoading) {
      return (
        <div className='flex flex-col items-center justify-center py-16 border border-dashed rounded-2xl bg-muted/10'>
          <Icons.notification className='text-muted-foreground/40 mb-3 h-10 w-10' />
          <p className='text-muted-foreground text-sm font-medium'>Không có thông báo nào</p>
        </div>
      );
    }

    return (
      <div className='flex flex-col gap-2'>
        {historyNotifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            id={notification.id}
            title={notification.title}
            body={notification.body}
            status={notification.status}
            createdAt={notification.createdAt}
            actions={notification.actions}
            onMarkAsRead={markAsRead}
            onAction={handleAction}
            className='border shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300'
          />
        ))}
      </div>
    );
  };

  return (
    <PageContainer
      pageTitle='Thông báo hệ thống'
      pageDescription='Xem và quản lý tất cả các thông báo hệ thống dành cho quản trị viên.'
      pageHeaderAction={
        count > 0 ? (
          <Button variant='outline' size='sm' onClick={markAllAsRead} className='flex items-center gap-1.5'>
            <Icons.check size={14} />
            Đánh dấu tất cả đã đọc
          </Button>
        ) : undefined
      }
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value='all'>Tất cả</TabsTrigger>
          <TabsTrigger value='unread'>Chưa đọc ({count})</TabsTrigger>
          <TabsTrigger value='read'>Đã đọc</TabsTrigger>
        </TabsList>
        
        <div className='mt-4 space-y-4'>
          {renderList()}
          
          {/* Intersection Target for Infinite Scroll */}
          <div ref={loadMoreRef} className='py-4 flex justify-center w-full min-h-[40px]'>
            {historyLoading && (
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <Icons.spinner className='h-4 w-4 animate-spin text-primary' />
                Đang tải thêm...
              </div>
            )}
          </div>
        </div>
      </Tabs>
    </PageContainer>
  );
}
