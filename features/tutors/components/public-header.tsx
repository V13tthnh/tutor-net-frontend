'use client';

import { Button } from '@/components/ui/button';
import { ThemeModeToggle } from '@/components/themes/theme-mode-toggle';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn, getAvatarUrl } from '@/lib/utils';
import { IconMenu2, IconX, IconSearch, IconPlus } from '@tabler/icons-react';
import { Icons } from '@/components/icons';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Subject } from '@/features/subjects/api/types';
import { clientLogoutAction } from '@/features/auth/actions/client-logout';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { NotificationCenter } from '@/features/notifications/components/notification-center';
import { toast } from 'sonner';

type NavCategory = { label: string; items: { name: string; slug: string }[] };

const MORE_LINKS = [
  { href: '/pricing', label: 'Học phí' },
  { href: '/about', label: 'Giới thiệu' },
  { href: '/blog', label: 'Blog' },
  { href: '/faq', label: 'Hỏi đáp' },
  { href: '/contact', label: 'Liên hệ' }
];

function SubjectDropdown({
  href,
  label,
  allLabel,
  categories,
  isActive,
}: {
  href: string;
  label: string;
  allLabel: string;
  categories: NavCategory[];
  isActive: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          suppressHydrationWarning
          className={cn(
            'text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors outline-none cursor-pointer',
            isActive && 'text-foreground bg-muted'
          )}
        >
          {label}
          <Icons.chevronDown size={14} className='opacity-50' />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='w-48'>
        <DropdownMenuItem asChild>
          <Link href={href} className='w-full cursor-pointer font-medium'>
            {allLabel}
          </Link>
        </DropdownMenuItem>
        {categories.map((cat) => (
          <DropdownMenuSub key={cat.label}>
            <DropdownMenuSubTrigger className='cursor-pointer'>{cat.label}</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className='w-48'>
                {cat.items.map((item) => (
                  <DropdownMenuItem key={item.slug} asChild>
                    <Link
                      href={`${href}?subject=${encodeURIComponent(item.slug)}`}
                      className='w-full cursor-pointer'
                    >
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading } = useAuthSession();
  const [mounted, setMounted] = useState(false);
  const [subjectCategories, setSubjectCategories] = useState<NavCategory[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    apiClient<{ data: Subject[] }>('/subjects/tree')
      .then((res) => {
        const cats: NavCategory[] = (res.data ?? []).map((parent) => ({
          label: parent.name,
          items: (parent.children ?? []).map((child) => ({ name: child.name, slug: child.slug }))
        }));
        setSubjectCategories(cats);
      })
      .catch(() => {
        // silently ignore — dropdown sẽ chỉ hiện "Tất cả"
      });
  }, []);

  return (
    <header className='bg-background/80 sticky top-0 z-50 border-b backdrop-blur-xl'>
      {/* ── Top utility bar ─────────────────────────────────────────────── */}
      <div className='border-b border-border/60 bg-muted/40'>
        <div className='mx-auto flex h-8 max-w-7xl items-center justify-end gap-0.5 px-4 sm:px-6 lg:px-8'>
          <Link
            href='/track-class'
            className={cn(
              'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors',
              mounted && pathname?.startsWith('/track-class')
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <IconSearch size={11} />
            Tra cứu thông tin lớp
          </Link>
          <span className='h-3 w-px bg-border mx-0.5' />
          <Link
            href='/post-class'
            className={cn(
              'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors',
              mounted && pathname?.startsWith('/post-class')
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <IconPlus size={11} />
            Đăng lớp
          </Link>
          <span className='h-3 w-px bg-border mx-0.5' />
          <button
            type='button'
            onClick={() => {
              if (!user?.email) {
                toast.info('Vui lòng đăng nhập', {
                  description: 'Bạn cần có tài khoản để tiếp tục.',
                  action: { label: 'Đăng nhập', onClick: () => { window.location.href = '/auth/login'; } },
                });
                return;
              }
              window.location.href = `/account/${user.email.split('@')[0]}/new-cv`;
            }}
            className={cn(
              'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
              mounted && pathname?.includes('/new-cv')
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <IconPlus size={11} />
            Đăng ký làm gia sư
          </button>
        </div>
      </div>

      <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
        {/* Logo */}
        <Link href='/' className='flex items-center gap-2' id='public-logo'>
          <div className='bg-primary flex h-8 w-8 items-center justify-center rounded-lg'>
            <Icons.school className='text-primary-foreground' />
          </div>
          <span className='text-foreground text-lg font-bold tracking-tight'>TutorNet</span>
        </Link>

        {/* Desktop nav */}
        <nav className='hidden items-center gap-1 md:flex'>
          {/* Tìm gia sư dropdown */}
          <SubjectDropdown
            href="/tutors"
            label="Tìm gia sư"
            allLabel="Tất cả gia sư"
            categories={subjectCategories}
            isActive={mounted && !!pathname?.startsWith('/tutors')}
          />

          {/* Tìm lớp học dropdown */}
          <SubjectDropdown
            href="/classes"
            label="Tìm lớp học"
            allLabel="Tất cả lớp học"
            categories={subjectCategories}
            isActive={mounted && !!pathname?.startsWith('/classes')}
          />

          {/* Khác dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                suppressHydrationWarning
                className={cn(
                  'text-muted-foreground hover:text-foreground inline-flex items-center justify-center rounded-md px-2 py-1.5 transition-colors outline-none cursor-pointer',
                  mounted && MORE_LINKS.some(item => pathname === item.href) && 'text-foreground bg-muted'
                )}
                aria-label="Xem thêm"
              >
                <Icons.moreHorizontal size={20} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {MORE_LINKS.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href} className={cn('w-full cursor-pointer', pathname === item.href && 'font-medium text-primary')}>
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Desktop actions */}
        <div className='hidden items-center gap-2 md:flex'>
          <ThemeModeToggle />

          {!mounted || loading ? (
            <div className='h-9 w-24 animate-pulse rounded-md bg-muted' />
          ) : user ? (
            <> <NotificationCenter />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    suppressHydrationWarning
                    className='flex h-9 items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm font-medium hover:bg-accent transition-colors outline-none cursor-pointer'
                  >
                    <div className='h-6 w-6 overflow-hidden rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary'>
                      {user.avatarUrl ? (
                        <img src={getAvatarUrl(user.avatarUrl)} alt={user.fullName} className='h-full w-full object-cover' />
                      ) : (
                        user.fullName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className='max-w-[120px] truncate text-foreground'>{user.fullName}</span>
                    <Icons.chevronDown size={14} className='opacity-50' />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-56'>
                  <div className='flex flex-col space-y-1 p-2 border-b'>
                    <p className='text-sm font-medium leading-none'>{user.fullName}</p>
                    <p className='text-xs leading-none text-muted-foreground truncate'>{user.email}</p>
                    <p className='text-[10px] uppercase font-bold text-primary tracking-wider mt-1'>
                      {user.roles.includes('tutor') ? 'Gia sư' : user.roles.includes('student') ? 'Học sinh' : user.roles.includes('parent') ? 'Phụ huynh' : 'Người dùng'}
                    </p>
                  </div>
                  <DropdownMenuItem asChild className='cursor-pointer'>
                    <Link href={`/account/${user.email.split('@')[0]}`}>
                      <Icons.account className='mr-2 h-4 w-4' />
                      Trang cá nhân
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className='cursor-pointer'>
                    <Link href={`/account/${user.email.split('@')[0]}/notifications`}>
                      <Icons.notification className='mr-2 h-4 w-4' />
                      Thông báo
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={async () => {
                      await clientLogoutAction();
                      window.location.href = '/auth/login';
                    }}
                    className='hover:text-destructive  cursor-pointer'
                  >
                    <Icons.logout className='mr-2 h-4 w-4' />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu></>
          ) : (
            <>
              <Link href='/auth/login'>
                <Button variant='ghost'>Đăng nhập</Button>
              </Link>

            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className='flex items-center gap-2 md:hidden'>
          <ThemeModeToggle />
          <NotificationCenter />
          <Button
            variant='ghost'
            size='icon'
            className='h-9 w-9'
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label='Toggle menu'
          >
            {mobileOpen ? <IconX size={20} /> : <IconMenu2 size={20} />}
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className='bg-background border-b px-4 pb-4 md:hidden'>
          <nav className='flex flex-col gap-1 pt-2'>
            {['/tutors', '/classes'].map((href) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'text-muted-foreground hover:underline hover:text-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  mounted && pathname?.startsWith(href) && 'text-foreground bg-muted'
                )}
              >
                {href === '/tutors' ? 'Tìm gia sư' : 'Tìm lớp học'}
              </Link>
            ))}
            {MORE_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'text-muted-foreground hover:underline hover:text-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  mounted && pathname === item.href && 'text-foreground bg-muted'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {!mounted || loading ? (
            <div className='h-9 w-full animate-pulse rounded-md bg-muted' />
          ) : user ? (
            <div className='flex flex-col gap-2 border-t pt-3'>
              <div className='flex items-center gap-3 px-3 py-2'>
                <div className='h-10 w-10 overflow-hidden rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary'>
                  {user.avatarUrl ? (
                    <img src={getAvatarUrl(user.avatarUrl)} alt={user.fullName} className='h-full w-full object-cover' />
                  ) : (
                    user.fullName.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className='text-sm font-semibold text-foreground'>{user.fullName}</p>
                  <p className='text-xs text-muted-foreground'>{user.email}</p>
                </div>
              </div>
              <Link href={`/account/${user.email.split('@')[0]}`} onClick={() => setMobileOpen(false)}>
                <Button variant='outline' className='w-full justify-start gap-2 h-10'>
                  <Icons.account size={16} />
                  Trang cá nhân
                </Button>
              </Link>
              {user.roles.includes('tutor') && (
                <Link href='/dashboard/overview' onClick={() => setMobileOpen(false)}>
                  <Button variant='outline' className='w-full justify-start gap-2 h-10'>
                    <Icons.dashboard size={16} />
                    Bảng điều khiển
                  </Button>
                </Link>
              )}
              <Button
                variant='destructive'
                className='w-full justify-start gap-2 h-10'
                onClick={async () => {
                  setMobileOpen(false);
                  await clientLogoutAction();
                  window.location.href = '/auth/sign-in';
                }}
              >
                <Icons.logout size={16} />
                Đăng xuất
              </Button>
            </div>
          ) : (
            <div className='mt-3 flex flex-col gap-2'>
              <Link href='/auth/login' onClick={() => setMobileOpen(false)}>
                <Button variant='outline' className='w-full'>
                  Đăng nhập
                </Button>
              </Link>
              <Link href='/auth/register' onClick={() => setMobileOpen(false)}>
                <Button className='w-full'>
                  Đăng ký
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
