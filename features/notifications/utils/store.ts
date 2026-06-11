import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';
import type { NotificationStatus, NotificationAction } from '@/components/ui/notification-card';

export type Notification = {
  id: string;
  title: string;
  body: string;
  status: NotificationStatus;
  createdAt: string;
  redirectUrl?: string;
  actions?: NotificationAction[];
  type: string;
};

type NotificationState = {
  notifications: Notification[];
  loading: boolean;
  historyNotifications: Notification[];
  historyHasMore: boolean;
  historyPage: number;
  historyLoading: boolean;
  fetchUnread: () => Promise<void>;
  fetchUnreadCount: () => Promise<number>;
  fetchHistory: (isRead: boolean | null, reset?: boolean) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'status'>) => void;
  unreadCount: () => number;
};

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  loading: false,
  historyNotifications: [],
  historyHasMore: true,
  historyPage: 1,
  historyLoading: false,

  fetchUnread: async () => {
    set({ loading: true });
    try {
      const res = await apiClient<any>('/notifications/unread');
      const rawList = res?.data || res || [];
      const mappedList: Notification[] = rawList.map((n: any) => {
        const redirectUrl = (() => {
          try {
            if (n.data) {
              const parsed = JSON.parse(n.data);
              return parsed.redirect || undefined;
            }
          } catch { }
          return undefined;
        })();
        return {
          id: String(n.id),
          title: n.title,
          body: n.body,
          status: n.isRead || n.readAt ? ('read' as const) : ('unread' as const),
          createdAt: n.createdAt,
          redirectUrl,
          actions: redirectUrl
            ? [
              {
                id: 'redirect_action',
                label: 'Xem chi tiết',
                type: 'redirect' as const,
                style: 'primary' as const
              }
            ]
            : undefined,
          type: n.type
        };
      });
      set({ notifications: mappedList });
    } catch (err) {
      console.error('Failed to fetch unread notifications:', err);
    } finally {
      set({ loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await apiClient<any>('/notifications/unread/count');
      const count = typeof res?.data === 'number' ? res.data : typeof res === 'number' ? res : 0;
      return count;
    } catch (err) {
      console.error('Failed to fetch unread notification count:', err);
      return 0;
    }
  },

  fetchHistory: async (isRead, reset = false) => {
    const pageToFetch = reset ? 1 : get().historyPage;
    set({ historyLoading: true });
    try {
      const isReadParam = isRead === null ? '' : `&isRead=${isRead}`;
      const res = await apiClient<any>(`/notifications?page=${pageToFetch}&size=20${isReadParam}`);
      const pageData = res?.data || res;
      const content = pageData?.content || [];
      const isLast = pageData?.last ?? true;

      const mappedList: Notification[] = content.map((n: any) => {
        const redirectUrl = (() => {
          try {
            if (n.data) {
              const parsed = JSON.parse(n.data);
              return parsed.redirect || undefined;
            }
          } catch { }
          return undefined;
        })();
        return {
          id: String(n.id),
          title: n.title,
          body: n.body,
          status: n.isRead || n.readAt ? ('read' as const) : ('unread' as const),
          createdAt: n.createdAt,
          redirectUrl,
          actions: redirectUrl
            ? [
              {
                id: 'redirect_action',
                label: 'Xem chi tiết',
                type: 'redirect' as const,
                style: 'primary' as const
              }
            ]
            : undefined
        };
      });

      set((state) => {
        const existing = reset ? [] : state.historyNotifications;
        const merged = [...existing];
        mappedList.forEach((item) => {
          if (!merged.some((m) => m.id === item.id)) {
            merged.push(item);
          }
        });

        return {
          historyNotifications: merged,
          historyHasMore: !isLast,
          historyPage: pageToFetch + 1
        };
      });
    } catch (err) {
      console.error('Failed to fetch notifications history:', err);
    } finally {
      set({ historyLoading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await apiClient(`/notifications/${id}/mark-read`, { method: 'PATCH' });
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, status: 'read' as const } : n
        ),
        historyNotifications: state.historyNotifications.map((n) =>
          n.id === id ? { ...n, status: 'read' as const } : n
        )
      }));
    } catch (err) {
      console.error(`Failed to mark notification ${id} as read:`, err);
    }
  },

  markAllAsRead: async () => {
    try {
      await apiClient('/notifications/mark-all-read', { method: 'PATCH' });
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          status: 'read' as const
        })),
        historyNotifications: state.historyNotifications.map((n) => ({
          ...n,
          status: 'read' as const
        }))
      }));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id)
    })),

  addNotification: (notification) =>
    set((state) => {
      // Tránh thêm trùng lặp notification có cùng ID (gây lỗi key React)
      if (state.notifications.some((n) => n.id === notification.id)) {
        return state;
      }
      // Tạo đối tượng thông báo mới với trạng thái mặc định là chưa đọc
      const newNotif = { ...notification, status: 'unread' as const };
      return {
        // Đẩy vào mảng của thanh Dropdown đầu trang 
        notifications: [newNotif, ...state.notifications],
        // Đẩy vào mảng của trang quản lý lịch sử để giao diện hiển thị NGAY LẬP TỨC
        historyNotifications: [newNotif, ...state.historyNotifications]
      };
    }),

  unreadCount: () => get().notifications.filter((n) => n.status === 'unread').length
}));
