'use client';

import type { FC } from 'react';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

export type NotificationStatus = 'unread' | 'read' | 'archived';
export type ActionType = 'redirect' | 'api_call' | 'workflow' | 'modal';
export type ActionStyle = 'primary' | 'danger' | 'default';

export interface NotificationAction {
  id: string;
  label: string;
  type: ActionType;
  style?: ActionStyle;
  executed?: boolean;
}

export interface NotificationCardProps {
  id: string;
  title: string;
  body: string;
  status?: NotificationStatus;
  createdAt?: string | Date;
  type?: string; // Khớp với trường type từ DB
  actions?: NotificationAction[];
  onMarkAsRead?: (id: string) => void;
  onAction?: (notificationId: string, actionId: string, actionType: ActionType) => void;
  loadingActionId?: string;
  className?: string;
}

const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

const getActionIcon = (actionType: ActionType) => {
  const iconProps = { size: 12, strokeWidth: 2.5 };
  switch (actionType) {
    case 'redirect':
      return <Icons.externalLink {...iconProps} />;
    case 'api_call':
      return <Icons.check {...iconProps} />;
    case 'workflow':
      return <Icons.clock {...iconProps} />;
    case 'modal':
      return <Icons.alertCircle {...iconProps} />;
    default:
      return null;
  }
};

// 🌟 BỔ SUNG: Hàm ánh xạ 'type' từ DB sang Icon và Màu sắc tương ứng
const getNotificationTypeConfig = (type?: string) => {
  const iconProps = { size: 18, className: "flex-shrink-0" };

  switch (type) {
    case 'class_review_result':
    case 'class_confirmed':
      return {
        icon: <Icons.check {...iconProps} className="text-green-500" />,
        wrapperClass: "bg-green-500/10"
      };
    case 'new_application':
      return {
        icon: <Icons.user {...iconProps} className="text-sky-500" />,
        wrapperClass: "bg-sky-500/10"
      };
    case 'payment_received':
      return {
        icon: <Icons.payment {...iconProps} className="text-amber-500" />,
        wrapperClass: "bg-amber-500/10"
      };
    case 'session_reminder':
    case 'session_cancelled':
      return {
        icon: <Icons.clock {...iconProps} className="text-destructive" />,
        wrapperClass: "bg-destructive/10"
      };
    default: // Mặc định nếu không khớp loại nào
      return {
        icon: <Icons.notification {...iconProps} className="text-muted-foreground" />,
        wrapperClass: "bg-muted-foreground/10"
      };
  }
};

export const NotificationCard: FC<NotificationCardProps> = ({
  id,
  title,
  body,
  status = 'unread',
  createdAt,
  type,
  actions = [],
  onMarkAsRead,
  onAction,
  loadingActionId,
  className
}) => {
  const isUnread = status === 'unread';

  // Lấy cấu hình Icon dựa trên type truyền vào
  const typeConfig = getNotificationTypeConfig(type);

  return (
    <div
      className={cn(
        'group relative w-full rounded-2xl transition-all',
        isUnread ? 'bg-muted' : 'bg-muted/40',
        className
      )}
    >
      <div className='px-4 py-3.5'>
        <div className='flex items-start gap-3.5'>

          {/* 🌟 BỔ SUNG: Render vòng tròn chứa Icon đại diện cho loại thông báo */}
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0', typeConfig.wrapperClass)}>
            {typeConfig.icon}
          </div>

          {/* Main content */}
          <div className='min-w-0 flex-1 space-y-1'>
            {/* Title with unread indicator */}
            <div className='flex items-center gap-2'>
              <h3
                className={cn(
                  'text-[15px] leading-tight font-semibold',
                  isUnread ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {title}
              </h3>
              {isUnread && <div className='h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-500' />}
            </div>

            {/* Description */}
            <p
              className={cn(
                'mb-0 text-[13px]',
                isUnread ? 'text-muted-foreground' : 'text-muted-foreground/60'
              )}
            >
              {body}
            </p>
          </div>

          {/* Mark as read button */}
          {isUnread && onMarkAsRead && (
            <button
              type='button'
              onClick={() => onMarkAsRead(id)}
              className={cn(
                'rounded-lg p-1.5 transition-colors flex-shrink-0',
                'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
              aria-label='Mark as read'
            >
              <Icons.check size={16} />
            </button>
          )}
        </div>

        {/* Đẩy lùi margin-left phần actions để thẳng hàng với text bên trên (bù trừ kích thước của Icon) */}
        <div className='mt-3 flex items-end justify-between pl-[46px]'>
          {/* Actions */}
          {actions.length > 0 && (
            <div className={cn('flex flex-wrap items-center gap-2', !isUnread && 'opacity-60')}>
              {actions.map((action) => {
                const isLoading = loadingActionId === action.id;
                const isExecuted = action.executed || false;
                const showLoading = isLoading && action.type !== 'modal';

                return (
                  <button
                    key={action.id}
                    type='button'
                    disabled={isLoading || isExecuted}
                    onClick={() => onAction?.(id, action.id, action.type)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-normal transition',
                      action.style === 'primary'
                        ? 'bg-primary/10 text-primary hover:bg-primary/20'
                        : action.style === 'danger'
                          ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                          : 'bg-accent text-muted-foreground hover:bg-accent hover:text-foreground',
                      showLoading && 'opacity-50',
                      isExecuted && 'cursor-not-allowed opacity-60'
                    )}
                  >
                    {showLoading ? (
                      <Icons.spinner size={12} className='animate-spin' />
                    ) : (
                      <>
                        <span>{action.label}</span>
                        {isExecuted ? (
                          <Icons.check size={12} strokeWidth={2.5} />
                        ) : (
                          getActionIcon(action.type)
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Timestamp */}
          {createdAt && (
            <span className='text-muted-foreground/60 inline-block text-[11px] ml-auto'>
              {formatDate(createdAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};