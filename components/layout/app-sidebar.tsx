'use client';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar
} from '@/components/ui/sidebar';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { navGroups } from '@/config/nav-config';
import { useMediaQuery } from '@/hooks/use-media-query';
import Link from 'next/link';

// Mock Clerk hooks locally to prevent network requests and errors
const useUser = () => ({ user: null });
const useOrganization = () => ({ organization: null });
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';
import { getAvatarUrl } from '@/lib/utils';
//import { OrgSwitcher } from '../org-switcher';

interface AppSidebarProps {
  adminId?: string | number;
  adminName?: string;
  adminAvatar?: string;
}

export default function AppSidebar({ adminId, adminName, adminAvatar }: AppSidebarProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');
  const { isOpen } = useMediaQuery();
  const { user } = useUser();
  const { organization } = useOrganization();
  const router = useRouter();
  const filteredGroups = navGroups;
  const { state } = useSidebar();

  const [adminUser, setAdminUser] = React.useState({
    id: adminId || '',
    name: adminName || 'Quản trị viên',
    avatar: adminAvatar || ''
  });

  React.useEffect(() => {
    if (adminName) {
      setAdminUser({
        id: adminId || '',
        name: adminName,
        avatar: adminAvatar || ''
      });
      if (adminId) {
        localStorage.setItem('active_user_id', String(adminId));
      }
      localStorage.setItem('active_user_name', adminName);
      if (adminAvatar) {
        localStorage.setItem('active_user_avatar', adminAvatar);
      }
    } else if (typeof window !== 'undefined' && isAdminRoute) {
      const storedId = localStorage.getItem('active_user_id');
      const storedName = localStorage.getItem('active_user_name');
      const storedAvatar = localStorage.getItem('active_user_avatar');
      if (storedName || storedId) {
        setAdminUser({
          id: storedId || '',
          name: storedName || 'Quản trị viên',
          avatar: storedAvatar || ''
        });
      }
    }
  }, [adminId, adminName, adminAvatar, isAdminRoute]);

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader className='group-data-[collapsible=icon]:pt-4'>
        {isAdminRoute ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size='lg' asChild>
                <Link href='/admin/users'>
                  <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg'>
                    <Icons.shieldCheck className='size-4' />
                  </div>
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-medium'>TutorNet Admin</span>
                    <span className='text-muted-foreground truncate text-xs'>Server session</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          // <OrgSwitcher />
          <></>
        )}
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden'>
        {filteredGroups.map((group) => (
          <SidebarGroup key={group.label || 'ungrouped'} className='py-0'>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarMenu>
              {group.items.map((item) => {
                const Icon = item.icon ? Icons[item.icon] : Icons.logo;
                return item?.items && item?.items?.length > 0 ? (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={item.isActive}
                    className='group/collapsible'
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title} isActive={pathname === item.url}>
                          {item.icon && <Icon />}
                          <span>{item.title}</span>
                          <Icons.chevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => {
                            const Icon = subItem.icon ? Icons[subItem.icon] : Icons.logo;
                            return (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                  <Link href={subItem.url}>
                                    {subItem.icon && <Icon />}
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={pathname === item.url}
                    >
                      <Link href={item.url}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  {user ? (
                    <UserAvatarProfile className='h-8 w-8 rounded-lg' showInfo={state !== 'collapsed'} user={user} />
                  ) : isAdminRoute ? (
                    <>
                      <div className='bg-sidebar-primary text-sidebar-primary-foreground flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg'>
                        {adminUser.avatar ? (
                          <img src={getAvatarUrl(adminUser.avatar)} alt={adminUser.name} className='h-full w-full object-cover' />
                        ) : (
                          <Icons.shieldCheck className='h-4 w-4' />
                        )}
                      </div>
                      {state !== 'collapsed' && (
                        <div className='grid flex-1 text-left text-sm leading-tight'>
                          <span className='truncate font-medium'>{adminUser.name}</span>
                          <span className='text-muted-foreground truncate text-xs'>Admin session</span>
                        </div>
                      )}
                    </>
                  ) : null}
                  {state !== 'collapsed' && <Icons.chevronsDown className='ml-auto size-4' />}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                side='bottom'
                align='end'
                sideOffset={4}
              >
                <DropdownMenuLabel className='p-0 font-normal'>
                  <div className='px-1 py-1.5'>
                    {user ? (
                      <UserAvatarProfile className='h-8 w-8 rounded-lg' showInfo user={user} />
                    ) : isAdminRoute ? (
                      <div className='flex items-center gap-2 px-1'>
                        <div className='bg-sidebar-primary text-sidebar-primary-foreground flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg'>
                          {adminUser.avatar ? (
                            <img src={getAvatarUrl(adminUser.avatar)} alt={adminUser.name} className='h-full w-full object-cover' />
                          ) : (
                            <Icons.shieldCheck className='h-4 w-4' />
                          )}
                        </div>
                        <div className='grid text-sm leading-tight'>
                          <span className='truncate font-medium'>{adminUser.name}</span>
                          <span className='text-muted-foreground truncate text-xs'>Admin session</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => {
                      if (isAdminRoute && adminUser.id) {
                        router.push(`/admin/users/${adminUser.id}`);
                      } else {
                        router.push('/dashboard/profile');
                      }
                    }}
                  >
                    <Icons.account className='mr-2 h-4 w-4' />
                    Thông tin cá nhân
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => {
                      if (isAdminRoute) {
                        router.push('/admin/notifications');
                      } else {
                        router.push('/dashboard/notifications');
                      }
                    }}
                  >
                    <Icons.notification className='mr-2 h-4 w-4' />
                    Thông báo
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {isAdminRoute ? (
                  <DropdownMenuItem asChild>
                    <a href='/admin/logout'>
                      <Icons.logout className='mr-2 h-4 w-4' />
                      Đăng xuất
                    </a>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => router.push('/auth/sign-in')}>
                    <Icons.logout className='mr-2 h-4 w-4' />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
