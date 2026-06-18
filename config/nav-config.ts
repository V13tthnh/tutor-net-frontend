import { NavGroup } from '@/types';

/**
 * This configuration is used for both the sidebar navigation and Cmd+K bar.
 * Items are organized into groups, each rendered with a SidebarGroupLabel.
 */
export const navGroups: NavGroup[] = [
  {
    label: 'Tổng quan',
    items: [
      {
        title: 'Dashboard',
        url: '/admin',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      }
    ]
  },
  {
    label: 'Người dùng',
    items: [
      {
        title: 'Gia sư',
        url: '#',
        icon: 'user',
        isActive: false,
        items: [
          {
            title: 'Danh sách gia sư',
            url: '/admin/tutors',
            icon: 'list',
            shortcut: ['c', 'c'],
            isActive: false,

          },
          {
            title: 'Danh sách lời mời',
            url: '/admin/tutor-invitations',
            icon: 'send',
            shortcut: ['t', 'i'],
            isActive: false,
          },
        ]
      }
    ]
  },
  {
    label: 'Lớp học',
    items: [
      {
        title: 'Lớp học',
        url: '#',
        icon: 'class',
        isActive: true,
        items: [
          {
            title: 'Tất cả lớp học',
            url: '/admin/class-requests',
            icon: 'list',
            shortcut: ['c', 'c'],
            isActive: false,

          },
          {
            title: 'Môn học',
            url: '/admin/subjects',
            icon: 'book',
            shortcut: ['s', 's'],
            isActive: false,

          },
          {
            title: 'Nhận xét',
            url: '/admin/reviews',
            icon: 'comment',
            shortcut: ['r', 'e'],
            isActive: false,

          }
        ]
      },
    ]
  },
  {
    label: 'Thanh toán',
    items: [
      {
        title: 'Giao dịch',
        url: '#',
        icon: 'transaction',
        isActive: true,
        items: [
          {
            title: 'Tất cả giao dịch',
            url: '/admin/payments/transaction',
            icon: 'list',
            shortcut: ['t', 't'],
            isActive: false,
            items: []
          },
          {
            title: 'Quản lý Hợp đồng',
            url: '/admin/contracts',
            icon: 'page',
            shortcut: ['c', 'h'],
            isActive: false,
          },
          {
            title: 'Khoản thanh toán',
            url: '/admin/payments/payout',
            icon: 'payment',
            shortcut: ['p', 'o'],
            isActive: false,
            items: []
          },
          {
            title: 'Tranh chấp',
            url: '/admin/payments/dispute',
            icon: 'warning',
            shortcut: ['d', 'p'],
            isActive: false,
            items: []
          }
        ]
      },

    ]
  },
  {
    label: 'Hệ thống',
    items: [
      {
        title: 'Thông báo',
        url: '/admin/notifications',
        icon: 'notification',
        shortcut: ['n', 'l'],
        isActive: false,
        items: []
      },
      {
        title: 'Cài đặt',
        url: '#',
        icon: 'settings',
        isActive: true,
        items: [
          {
            title: 'Cài đặt chung',
            url: '/admin/settings',
            icon: 'settings',
            shortcut: ['s', 's'],
            isActive: false,
            items: []
          },
          {
            title: 'Quản trị viên',
            url: '/admin/users',
            icon: 'admin',
            shortcut: ['u', 'u'],
            isActive: false,
            items: []
          },
          {
            title: 'Quyền & Vai trò',
            url: '/admin/roles',
            icon: 'account',
            shortcut: ['a', 'c'],
            isActive: true,
            items: []
          },
          {
            title: 'Audit Logs',
            url: '/admin/audit-logs',
            icon: 'logs',
            shortcut: ['a', 'l'],
            isActive: false,
            items: []
          }
        ]
      },
    ]
  },

];
