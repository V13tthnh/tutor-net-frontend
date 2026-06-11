'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    IconCamera, IconShieldCheck, IconCalendar, IconChevronRight,
    IconAlertCircle, IconX,
} from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PublicHeader } from '@/features/tutors/components/public-header';
import PublicFooter from '@/features/tutors/components/public-footer';
import { ScrollReveal } from '@/hooks/use-scroll-reveal';
import { Icons } from '@/components/icons';

const MOCK_USER = {
    name: 'Nguyễn Văn An',
    email: 'nguyenvanan@email.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user-an',
    role: 'Học sinh',
    joinDate: '01/2024',
    isVerified: true,
    // Để làm ví dụ, username dùng cho route sẽ lấy từ email hoặc data
    username: 'nguyenvanan'
};

const TABS = [
    { id: 'profile', label: 'Hồ sơ', icon: <Icons.user size={16} />, href: `/account/${MOCK_USER.username}` },
    { id: 'security', label: 'Bảo mật', icon: <Icons.lock size={16} />, href: `/account/${MOCK_USER.username}/security` },
    { id: 'notifications', label: 'Thông báo', icon: <Icons.notification size={16} />, href: `/account/${MOCK_USER.username}/notifications` },
    { id: 'saved', label: 'Gia sư đã lưu', icon: <Icons.heart size={16} />, href: `/account/${MOCK_USER.username}/saved` },
    { id: 'history', label: 'Lịch sử', icon: <Icons.history size={16} />, href: `/account/${MOCK_USER.username}/history` },
    { id: 'settings', label: 'Cài đặt', icon: <Icons.settings size={16} />, href: `/account/${MOCK_USER.username}/settings` }
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname(); // Lấy route hiện tại để active menu

    // State của riêng sidebar (avatar)
    const [avatarSrc, setAvatarSrc] = useState(MOCK_USER.avatar);
    const [avatarError, setAvatarError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const MAX_SIZE_MB = 2;

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAvatarError(null);
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setAvatarError('Chỉ chấp nhận file ảnh (JPG, PNG, WEBP).');
            return;
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            setAvatarError(`Ảnh vượt quá ${MAX_SIZE_MB}MB. Vui lòng chọn ảnh nhỏ hơn.`);
            return;
        }
        const url = URL.createObjectURL(file);
        setAvatarSrc(url);
        e.target.value = '';
    };

    return (
        <div className='min-h-screen bg-muted/20'>
            <PublicHeader />

            <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
                {/* ─── Breadcrumb ─── */}
                <ScrollReveal variant='fade-down' duration={600}>
                    <nav className='mb-6 flex items-center gap-1.5 text-xs text-muted-foreground'>
                        <Link href='/' className='hover:text-primary transition-colors'>Trang chủ</Link>
                        <Icons.chevronRight size={12} />
                        <span className='text-foreground font-medium'>{MOCK_USER.username}</span>
                    </nav>
                </ScrollReveal>

                <div className='flex flex-col gap-6 md:flex-row md:items-start'>
                    {/* ─── Sidebar ─── */}
                    <ScrollReveal variant='fade-right' duration={700} threshold={0.1}>
                        <aside className='md:w-60 shrink-0'>
                            <div className='rounded-2xl border bg-card p-5 text-center shadow-sm mb-3'>
                                <input ref={fileInputRef} type='file' accept='image/jpeg,image/png,image/webp' className='hidden' onChange={handleAvatarChange} />
                                <div className='relative inline-block'>
                                    <div className='h-20 w-20 overflow-hidden rounded-full ring-2 ring-primary ring-offset-2 mx-auto'>
                                        <Image src={avatarSrc} alt={MOCK_USER.name} width={80} height={80} className='h-full w-full object-cover' unoptimized />
                                    </div>
                                    <button type='button' onClick={() => { setAvatarError(null); fileInputRef.current?.click(); }} className='absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground shadow hover:bg-primary/90 transition-colors'>
                                        <Icons.camera size={12} />
                                    </button>
                                </div>
                                <p className='mt-2 text-xs text-muted-foreground'>JPG, PNG, WEBP · Tối đa 2MB</p>
                                {avatarError && (
                                    <div className='mt-2 flex items-start gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-left'>
                                        <Icons.alertCircle size={13} className='text-red-500 mt-0.5 shrink-0' />
                                        <p className='text-xs text-red-600 flex-1'>{avatarError}</p>
                                        <button onClick={() => setAvatarError(null)} className='text-red-400 hover:text-red-600 shrink-0'><Icons.close size={12} /></button>
                                    </div>
                                )}
                                <p className='mt-3 font-bold text-sm'>{MOCK_USER.name}</p>
                                <p className='text-xs text-muted-foreground truncate'>{MOCK_USER.email}</p>
                                <div className='mt-2 flex items-center justify-center gap-1.5 flex-wrap'>
                                    <Badge variant='secondary' className='text-xs'>{MOCK_USER.role}</Badge>
                                    {MOCK_USER.isVerified && <span className='flex items-center gap-1 text-xs text-primary'><Icons.shieldCheck size={12} /> Đã xác minh</span>}
                                </div>
                                <p className='mt-2 text-xs text-muted-foreground flex items-center justify-center gap-1'><Icons.calendar size={11} /> Tham gia {MOCK_USER.joinDate}</p>
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