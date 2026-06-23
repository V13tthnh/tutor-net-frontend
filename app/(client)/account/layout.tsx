'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PublicHeader } from '@/features/tutors/components/public-header';
import PublicFooter from '@/features/tutors/components/public-footer';
import { ScrollReveal } from '@/hooks/use-scroll-reveal';
import { Icons } from '@/components/icons';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { getAvatarUrl } from '@/lib/utils';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const { user, loading } = useAuthSession();
    const [avatarSrc, setAvatarSrc] = useState('');

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push(`/auth/login?redirectTo=${encodeURIComponent(pathname)}`);
                return;
            }

            setAvatarSrc(getAvatarUrl(user.avatarUrl) || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user-an');
        }
    }, [user, loading, pathname, router]);

    if (loading || !user) {
        return (
            <div className='flex min-h-screen flex-col items-center justify-center bg-background'>
                <div className='flex items-center gap-2'>
                    <Icons.spinner className='h-8 w-8 animate-spin text-primary' />
                    <span className='text-sm text-muted-foreground'>Đang tải thông tin tài khoản...</span>
                </div>
            </div>
        );
    }

    const TABS = [
        { id: 'profile', label: 'Hồ sơ', icon: <Icons.user size={16} />, href: `/account` },
        { id: 'notifications', label: 'Thông báo', icon: <Icons.notification size={16} />, href: `/account/notifications` },
        ...(user.roles.includes('tutor') ? [
            { id: 'invitations', label: 'Lời mời dạy', icon: <Icons.email size={16} />, href: `/account/invitations` }
        ] : []),
        { id: 'new-cv', label: user.roles.includes('tutor') ? 'Hồ sơ gia sư' : 'Đăng ký làm gia sư', icon: <Icons.cv size={16} />, href: `/account/new-cv` },
        { id: 'my-classes', label: 'Lớp của tôi', icon: <Icons.class size={16} />, href: `/account/my-classes` },
        { id: 'contracts', label: 'Hợp đồng của tôi', icon: <Icons.forms size={16} />, href: `/account/contracts` },
        { id: 'security', label: 'Bảo mật', icon: <Icons.lock size={16} />, href: `/account/security` },
    ];

    return (
        <div className='min-h-screen bg-muted/20'>
            <PublicHeader />

            <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
                {/* ─── Breadcrumb ─── */}
                <ScrollReveal variant='fade-down' duration={600}>
                    <nav className='mb-6 flex items-center gap-1.5 text-xs text-muted-foreground'>
                        <Link href='/' className='hover:text-primary transition-colors'>Trang chủ</Link>
                        <Icons.chevronRight size={12} />
                        <Link href='/' className='hover:text-primary transition-colors'>Tài khoản</Link>
                        <Icons.chevronRight size={12} />
                        <span className='text-foreground font-medium'>{user.fullName}</span>
                    </nav>
                </ScrollReveal>

                <div className='flex flex-col gap-6 md:flex-row md:items-start'>
                    {/* ─── Sidebar ─── */}
                    <ScrollReveal variant='fade-right' duration={700} threshold={0.1}>
                        <aside className='md:w-60 shrink-0'>
                            <div className='rounded-2xl border bg-card p-5 text-center shadow-sm mb-3'>
                                <div className='relative inline-block'>
                                    <div className='h-20 w-20 overflow-hidden rounded-full ring-2 ring-primary ring-offset-2 mx-auto'>
                                        {avatarSrc ? (
                                            <Image src={avatarSrc} alt={user.fullName} width={80} height={80} className='h-full w-full object-cover' unoptimized />
                                        ) : (
                                            <div className='h-full w-full flex items-center justify-center bg-primary/10 text-primary text-xl font-bold'>
                                                {user.fullName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className='mt-3 font-bold text-sm'>{user.fullName}</p>
                                <p className='text-xs text-muted-foreground truncate'>{user.email}</p>
                                <div className='mt-2 flex items-center justify-center gap-1.5 flex-wrap'>
                                    <Badge variant='secondary' className='text-xs'>
                                        {user.roles.includes('tutor') ? 'Gia sư' : user.roles.includes('parent') ? 'Phụ huynh' : 'Học sinh'}
                                    </Badge>
                                    <span className='flex items-center gap-1 text-xs text-primary'><Icons.shieldCheck size={12} /> Đã xác minh</span>
                                </div>
                                <p className='mt-2 text-xs text-muted-foreground flex items-center justify-center gap-1'><Icons.calendar size={11} /> Thành viên TutorNet</p>
                            </div>

                            {/* Nav tabs dùng Link thay cho button onClick */}
                            <nav className='rounded-2xl border bg-card shadow-sm overflow-hidden'>
                                {TABS.map((t) => {
                                    // Kiểm tra xem route hiện tại có khớp với href của tab không
                                    const isActive = pathname === t.href;
                                    return (
                                        <Link
                                            key={t.id}
                                            href={t.href}
                                            className={cn(
                                                'w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-colors text-left',
                                                isActive
                                                    ? 'bg-primary/10 text-primary border-r-2 border-primary'
                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                            )}
                                        >
                                            {t.icon}
                                            {t.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </aside>
                    </ScrollReveal>

                    {/* ─── Main Content (Thay đổi nội dung thông qua children) ─── */}
                    <main className='flex-1 min-w-0'>
                        {children}
                    </main>
                </div>
            </div>
            <PublicFooter />
        </div>
    );
}