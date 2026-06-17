'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { ScrollReveal } from '@/hooks/use-scroll-reveal';
import { useNotificationStore } from '@/features/notifications/utils/store';
import { NotificationCard } from '@/components/ui/notification-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';

export default function NotificationsPage() {
    const router = useRouter();
    const { accessToken } = useAuthSession();
    
    // Settings state
    const [settings, setSettings] = useState({
        email: true, sms: false, newTutor: true, booking: true, promo: false,
    });

    // Notification store state
    const {
        historyNotifications,
        historyHasMore,
        historyLoading,
        fetchHistory,
        markAsRead,
        markAllAsRead,
        unreadCount
    } = useNotificationStore();

    // Filters: null = Tất cả, false = Chưa đọc, true = Đã đọc
    const [filter, setFilter] = useState<boolean | null>(null);
    const count = unreadCount();

    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    // Fetch initial page on token/filter change
    useEffect(() => {
        if (accessToken) {
            fetchHistory(filter, true);
        }
    }, [accessToken, filter, fetchHistory]);

    // Intersection observer for infinite scroll
    useEffect(() => {
        const currentTarget = loadMoreRef.current;
        if (!currentTarget || !accessToken) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && historyHasMore && !historyLoading) {
                    fetchHistory(filter, false);
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
    }, [accessToken, historyHasMore, historyLoading, filter, fetchHistory]);

    const handleAction = async (notifId: string, actionId: string) => {
        const notif = historyNotifications.find((n) => n.id === notifId);
        if (notif?.redirectUrl) {
            await markAsRead(notifId);
            router.push(notif.redirectUrl);
        }
    };

    return (
        <ScrollReveal variant='fade-up' duration={650} threshold={0.05}>
            <div className='rounded-2xl border bg-card shadow-sm p-6'>
                <Tabs defaultValue='inbox' className='w-full'>
                    <div className='flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 mb-6 gap-4'>
                        <div>
                            <h2 className='text-xl font-bold tracking-tight'>Thông báo</h2>
                            <p className='text-sm text-muted-foreground'>Theo dõi tin tức và cập nhật quan trọng của bạn</p>
                        </div>
                        <TabsList className='grid w-full sm:w-[320px] grid-cols-2'>
                            <TabsTrigger value='inbox'>Hộp thư ({count > 9 ? '9+' : count})</TabsTrigger>
                            <TabsTrigger value='settings'>Cài đặt</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value='inbox' className='outline-none mt-0'>
                        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5'>
                            {/* Filters */}
                            <div className='flex flex-wrap gap-1.5'>
                                {[
                                    { value: null, label: 'Tất cả' },
                                    { value: false, label: `Chưa đọc (${count})` },
                                    { value: true, label: 'Đã đọc' }
                                ].map((tab) => (
                                    <Button
                                        key={String(tab.value)}
                                        variant={filter === tab.value ? 'default' : 'outline'}
                                        size='sm'
                                        onClick={() => setFilter(tab.value)}
                                        className='rounded-full text-xs px-4 h-8'
                                    >
                                        {tab.label}
                                    </Button>
                                ))}
                            </div>

                            {/* Mark all as read */}
                            {count > 0 && (
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={markAllAsRead}
                                    className='text-xs h-8 text-primary hover:text-primary/80 flex items-center gap-1.5'
                                >
                                    <Icons.check size={14} />
                                    Đánh dấu tất cả đã đọc
                                </Button>
                            )}
                        </div>

                        {/* List of notifications */}
                        <div className='space-y-3 min-h-[300px]'>
                            {historyNotifications.length === 0 && !historyLoading ? (
                                <div className='flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-2xl bg-muted/10'>
                                    <div className='rounded-full bg-primary/10 p-3 mb-3 text-primary'>
                                        <Icons.notification className='h-6 w-6' />
                                    </div>
                                    <p className='font-medium text-sm text-foreground'>Không có thông báo nào</p>
                                    <p className='text-xs text-muted-foreground mt-1 max-w-[280px]'>
                                        Bạn sẽ thấy các cập nhật, thông tin phản hồi từ hệ thống ở đây.
                                    </p>
                                </div>
                            ) : (
                                <div className='grid gap-3'>
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
                                            className='border shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-350 bg-card hover:bg-muted/10'
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Infinite scroll loader */}
                            <div ref={loadMoreRef} className='py-4 flex justify-center w-full min-h-[40px]'>
                                {historyLoading && (
                                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                                        <Icons.spinner className='h-4 w-4 animate-spin text-primary' />
                                        Đang tải thêm...
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value='settings' className='outline-none mt-0'>
                        <div className='space-y-3'>
                            {[
                                { key: 'email' as const, label: 'Thông báo qua Email', desc: 'Nhận email khi có cập nhật quan trọng' },
                                { key: 'sms' as const, label: 'Thông báo qua SMS', desc: 'Nhận tin nhắn về lịch học và thanh toán' },
                                { key: 'newTutor' as const, label: 'Gia sư mới phù hợp', desc: 'Khi có gia sư mới khớp yêu cầu của bạn' },
                                { key: 'booking' as const, label: 'Cập nhật đặt lịch', desc: 'Xác nhận và nhắc nhở về buổi học' },
                                { key: 'promo' as const, label: 'Khuyến mãi & ưu đãi', desc: 'Nhận thông tin về các chương trình ưu đãi' },
                            ].map((item, i) => (
                                <ScrollReveal key={item.key} variant='fade-left' delay={i * 60} duration={500} threshold={0.05}>
                                    <div className='flex items-center justify-between rounded-xl border p-4 hover:border-muted-foreground/30 transition-all duration-200 bg-card'>
                                        <div>
                                            <p className='font-medium text-sm'>{item.label}</p>
                                            <p className='text-xs text-muted-foreground'>{item.desc}</p>
                                        </div>
                                        <Switch
                                            checked={settings[item.key]}
                                            onCheckedChange={(v) => setSettings({ ...settings, [item.key]: v })}
                                        />
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </ScrollReveal>
    );
}
