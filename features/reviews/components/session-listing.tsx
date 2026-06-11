'use client';

import { useMemo, useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { useNotificationStore } from '@/features/notifications/utils/store';
import { cn } from '@/lib/utils';
import { createReviewMutation, completeSessionMutation } from '../api/mutations';
import {
  reviewQueryKeys,
  sessionQueryKeys,
  sessionsQueryOptions
} from '../api/queries';
import type { Session, SessionStatus } from '../api/types';
import { TutorReviewsTab } from './tutor-reviews-tab';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { parseAsInteger, useQueryStates } from 'nuqs';

const CLASS_PAGE_SIZE = 5;

const STATUS_META: Record<
  SessionStatus,
  {
    label: string;
    className: string;
    icon: keyof typeof Icons;
  }
> = {
  pending: {
    label: 'Chờ xác nhận',
    className: 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    icon: 'clock'
  },
  confirmed: {
    label: 'Đã xác nhận',
    className: 'border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400',
    icon: 'check'
  },
  ongoing: {
    label: 'Đang học',
    className: 'border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400',
    icon: 'school'
  },
  completed: {
    label: 'Hoàn thành',
    className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    icon: 'circleCheck'
  },
  cancelled: {
    label: 'Đã hủy',
    className: 'border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400',
    icon: 'close'
  }
};

function formatPrice(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDateTime(value: string) {
  const date = new Date(value);

  return {
    date: new Intl.DateTimeFormat('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    }).format(date),
    time: new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  };
}

function getStatusBadge(status: SessionStatus) {
  const meta = STATUS_META[status];
  const Icon = Icons[meta.icon];

  return (
    <Badge variant='outline' className={cn('rounded-full px-2.5 py-1', meta.className)}>
      <Icon className='h-3.5 w-3.5' />
      {meta.label}
    </Badge>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  tone
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: keyof typeof Icons;
  tone?: string;
}) {
  const Icon = Icons[icon];

  return (
    <Card className={cn('rounded-lg py-5', tone)}>
      <CardContent className='flex items-start justify-between gap-4'>
        <div>
          <p className='text-muted-foreground text-xs font-medium uppercase tracking-wide'>{label}</p>
          <p className='mt-2 text-3xl font-semibold tracking-normal'>{value}</p>
          <p className='text-muted-foreground mt-1 text-xs'>{hint}</p>
        </div>
        <div className='bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded-md'>
          <Icon className='h-5 w-5' />
        </div>
      </CardContent>
    </Card>
  );
}

export function SessionListingPage() {
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuthSession();
  const isLoaded = !authLoading;
  const userId = user?.id || 0;
  const userName = user?.fullName || '';
  const role = user?.roles.some(r => r === 'admin' || r === 'super_admin')
    ? 'admin'
    : user?.roles.includes('tutor')
    ? 'tutor'
    : 'parent';
  const { addNotification } = useNotificationStore();
  const [params, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(CLASS_PAGE_SIZE)
  });

  const page = params.page ?? 1;
  const perPage = params.limit ?? CLASS_PAGE_SIZE;
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isReported, setIsReported] = useState(false);
  const [privateFeedback, setPrivateFeedback] = useState('');

  const { data: sessions = [], isLoading } = useQuery(
    sessionsQueryOptions({
      role: isLoaded ? role : undefined,
      userId: isLoaded ? userId : undefined
    })
  );

  const completeMutation = useMutation({
    ...completeSessionMutation,
    onSuccess: (success) => {
      if (!success) {
        toast.error('Không thể cập nhật buổi học.');
        return;
      }

      toast.success('Đã đánh dấu hoàn thành buổi học.');
      queryClient.invalidateQueries({ queryKey: sessionQueryKeys.all });
    },
    onError: () => toast.error('Lỗi khi cập nhật buổi học.')
  });

  const reviewMutation = useMutation({
    ...createReviewMutation,
    onSuccess: (result) => {
      toast.success(
        result.auto_hidden
          ? 'Đánh giá đã gửi và đang chờ quản trị duyệt.'
          : 'Đã gửi đánh giá buổi học.'
      );

      if (selectedSession) {
        addNotification({
          id: Math.random().toString(),
          title: rating <= 3 || isReported ? 'Đánh giá cần kiểm tra' : 'Đánh giá mới',
          body: `${userName} đã đánh giá ${rating} sao cho gia sư ${selectedSession.tutor_name}.`,
          createdAt: new Date().toISOString(),
          actions: [
            {
              id: 'view-reviews',
              label: 'Xem kiểm duyệt',
              type: 'redirect',
              style: 'primary'
            }
          ]
        });
      }

      setSelectedSession(null);
      setRating(5);
      setComment('');
      setIsReported(false);
      setPrivateFeedback('');
      queryClient.invalidateQueries({ queryKey: sessionQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.all });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Lỗi khi gửi đánh giá.');
    }
  });

  const stats = useMemo(() => {
    const completed = sessions.filter((session) => session.status === 'completed');
    const active = sessions.filter((session) =>
      ['pending', 'confirmed', 'ongoing'].includes(session.status)
    );
    const reviewPending = completed.filter((session) => !session.has_review);
    const revenue = sessions.reduce((sum, session) => sum + session.price, 0);
    const cancelled = sessions.filter((session) => session.status === 'cancelled');

    return {
      completed: completed.length,
      active: active.length,
      cancelled: cancelled.length,
      reviewPending: reviewPending.length,
      revenue
    };
  }, [sessions]);

  const openReviewDialog = useCallback((session: Session) => {
    setSelectedSession(session);
    setRating(5);
    setHoverRating(0);
    setComment('');
    setIsReported(false);
    setPrivateFeedback('');
  }, []);

  const submitReview = () => {
    if (!selectedSession) {
      return;
    }

    if (comment.trim().length < 10) {
      toast.warning('Nhận xét công khai cần tối thiểu 10 ký tự.');
      return;
    }

    reviewMutation.mutate({
      session_id: selectedSession.id,
      reviewer_id: userId,
      reviewer_name: userName.replace(' (Phụ huynh)', ''),
      reviewer_avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`,
      reviewee_id: selectedSession.tutor_id,
      rating,
      comment,
      is_reported: isReported,
      private_feedback: isReported ? privateFeedback : ''
    });
  };

  

  const total = sessions.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, pageCount);
  const paginatedSessions = sessions.slice((safePage - 1) * perPage, safePage * perPage);

  const columns = useMemo(() => [
    {
      id: 'subject',
      header: 'Môn học',
      accessorFn: (row: Session) => row.subject,
      cell: (info: any) => (
        <div>
          <p className='font-semibold'>{info.getValue()}</p>
          <p className='text-muted-foreground text-xs'>#{info.row.original.id} · {info.row.original.duration_minutes} phút</p>
        </div>
      )
    },
    {
      id: 'participant',
      header: 'Người tham gia',
      accessorFn: (row: Session) => (role === 'tutor' ? row.student_name : row.tutor_name),
      cell: (info: any) => <div className='min-w-0'><p className='font-semibold truncate'>{info.getValue()}</p></div>
    },
    {
      id: 'schedule',
      header: 'Lịch',
      accessorFn: (row: Session) => row.scheduled_at,
      cell: (info: any) => {
        const { date, time } = formatDateTime(info.getValue());
        return <div className='text-sm text-muted-foreground'>{date}, {time}</div>;
      }
    },
    {
      id: 'status',
      header: 'Trạng thái',
      accessorFn: (row: Session) => row.status,
      cell: (info: any) => getStatusBadge(info.getValue())
    },
    {
      id: 'price',
      header: 'Giá',
      accessorFn: (row: Session) => row.price,
      cell: (info: any) => <div className='text-sm font-semibold'>{formatPrice(info.getValue())}</div>
    },
    {
      id: 'actions',
      header: 'Hành động',
      accessorFn: (row: Session) => row,
      cell: (info: any) => {
        const session: Session = info.getValue();
        const isCompleted = session.status === 'completed';
        const canReview = role === 'parent' && isCompleted && !session.has_review;
        const canComplete = session.status !== 'completed' && session.status !== 'cancelled';

        return (
          <div className='flex flex-wrap items-center gap-2 lg:justify-end'>
            {canReview && (
              <Button size='sm' onClick={() => openReviewDialog(session)}>
                <Icons.pro className='h-4 w-4' /> Đánh giá
              </Button>
            )}
            {canComplete && (
              <Button size='sm' variant='outline' onClick={() => completeMutation.mutate(session.id)} isLoading={completeMutation.isPending && completeMutation.variables === session.id}>
                Hoàn thành
              </Button>
            )}
          </div>
        );
      }
    }
  ], [role, openReviewDialog, completeMutation.isPending]);

  const { table } = useDataTable({
    data: paginatedSessions,
    columns: columns as any,
    pageCount,
    initialState: { pagination: { pageIndex: safePage - 1, pageSize: perPage } },
    shallow: true
  });

  if (!isLoaded || isLoading) {
    return (
      <div className='flex min-h-[360px] items-center justify-center rounded-lg border'>
        <Icons.spinner className='text-primary h-8 w-8 animate-spin' />
      </div>
    );
  }

  const content = (
    <div className='space-y-6'>
      <Card className='overflow-hidden rounded-lg py-0'>
        

        <CardContent className='p-0'>
          {sessions.length === 0 ? (
            <EmptyClasses />
          ) : (
            <div className='rounded-lg border'>
              <DataTable table={table}>
                <DataTableToolbar table={table} />
              </DataTable>
            </div>
          )}
        </CardContent>
      </Card>

      <ReviewDialog
        session={selectedSession}
        rating={rating}
        hoverRating={hoverRating}
        comment={comment}
        isReported={isReported}
        privateFeedback={privateFeedback}
        isSubmitting={reviewMutation.isPending}
        onOpenChange={(open) => !open && setSelectedSession(null)}
        onRatingChange={setRating}
        onHoverRatingChange={setHoverRating}
        onCommentChange={setComment}
        onReportedChange={setIsReported}
        onPrivateFeedbackChange={setPrivateFeedback}
        onSubmit={submitReview}
      />
    </div>
  );

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 md:grid-cols-4'>
        <StatCard label='Đang hoạt động' value={stats.active} hint='Chờ, xác nhận hoặc đang học' icon='clock' />
        <StatCard
          label='Hoàn thành'
          value={stats.completed}
          hint='Buổi học đã kết thúc'
          icon='circleCheck'
          tone='border-emerald-500/20'
        />
        <StatCard
          label='Chờ đánh giá'
          value={stats.reviewPending}
          hint='Cần phụ huynh phản hồi'
          icon='chat'
          tone='border-amber-500/20'
        />
        <StatCard label='Học phí' value={formatPrice(stats.revenue)} hint='Tổng giá trị danh sách' icon='billing' />
      </div>

      {role === 'tutor' ? (
        <Tabs defaultValue='classes' className='space-y-4'>
          <TabsList className='grid w-full max-w-[420px] grid-cols-2'>
            <TabsTrigger value='classes'>Lớp đang dạy</TabsTrigger>
            <TabsTrigger value='reviews'>Nhận xét nhận được</TabsTrigger>
          </TabsList>
          <TabsContent value='classes'>{content}</TabsContent>
          <TabsContent value='reviews'>
            <TutorReviewsTab />
          </TabsContent>
        </Tabs>
      ) : (
        content
      )}
    </div>
  );
}

function ListPagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className='flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between'>
      <p className='text-muted-foreground text-sm'>
        Hiển thị {start}-{end} trong {total} buổi học
      </p>
      <div className='flex items-center gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          <Icons.chevronLeft className='h-4 w-4' />
          Trước
        </Button>
        <div className='text-muted-foreground min-w-20 text-center text-sm'>
          {page}/{pageCount}
        </div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
        >
          Sau
          <Icons.chevronRight className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}

function EmptyClasses() {
  return (
    <div className='flex min-h-[260px] flex-col items-center justify-center gap-2 text-center'>
      <Icons.class className='text-muted-foreground/40 h-10 w-10' />
      <p className='font-medium'>Chưa có lớp học nào</p>
      <p className='text-muted-foreground max-w-sm text-sm'>
        Khi có lịch học mới, các buổi học và thao tác đánh giá sẽ xuất hiện tại đây.
      </p>
    </div>
  );
}

function ClassSessionRow({
  session,
  role,
  isCompleting,
  onComplete,
  onReview
}: {
  session: Session;
  role: string;
  isCompleting: boolean;
  onComplete: () => void;
  onReview: () => void;
}) {
  const schedule = formatDateTime(session.scheduled_at);
  const isCompleted = session.status === 'completed';
  const canReview = role === 'parent' && isCompleted && !session.has_review;
  const canComplete = session.status !== 'completed' && session.status !== 'cancelled';

  return (
    <div className='grid gap-4 px-6 py-5 transition-colors hover:bg-muted/35 lg:grid-cols-[minmax(220px,0.9fr)_minmax(260px,1fr)_minmax(200px,0.8fr)_auto]'>
      <div>
        <div className='flex items-center gap-2'>
          <div className='bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-md'>
            <Icons.book className='h-5 w-5' />
          </div>
          <div>
            <p className='font-semibold'>{session.subject}</p>
            <p className='text-muted-foreground text-xs'>#{session.id} · {session.duration_minutes} phút</p>
          </div>
        </div>
      </div>

      <div className='grid gap-3 sm:grid-cols-2'>
        <InfoBlock
          label={role === 'tutor' ? 'Học sinh' : 'Gia sư'}
          value={role === 'tutor' ? session.student_name : session.tutor_name}
          helper={role === 'tutor' ? `Phụ huynh ID ${session.booked_by}` : session.student_name}
          icon='user'
        />
        <InfoBlock
          label='Lịch học'
          value={`${schedule.date}, ${schedule.time}`}
          helper={session.status === 'ongoing' ? 'Đang diễn ra' : 'Theo lịch hệ thống'}
          icon='calendar'
        />
      </div>

      <div className='space-y-2'>
        {getStatusBadge(session.status)}
        <p className='text-sm font-semibold'>{formatPrice(session.price)}</p>
        {isCompleted && (
          <p className='text-muted-foreground text-xs'>
            {session.has_review ? 'Đã có đánh giá' : 'Đang chờ đánh giá'}
          </p>
        )}
      </div>

      <div className='flex flex-wrap items-center gap-2 lg:justify-end'>
        {canReview && (
          <Button size='sm' onClick={onReview}>
            <Icons.pro className='h-4 w-4' />
            Đánh giá
          </Button>
        )}
        {role === 'parent' && isCompleted && session.has_review && (
          <Badge variant='outline' className='rounded-full'>
            <Icons.check className='h-3.5 w-3.5' />
            Đã đánh giá
          </Badge>
        )}
        {canComplete && (
          <Button size='sm' variant='outline' onClick={onComplete} isLoading={isCompleting}>
            Hoàn thành
          </Button>
        )}
        {(role === 'admin' || role === 'tutor') && isCompleted && !canReview && (
          <span className='text-muted-foreground text-xs'>
            {session.has_review ? 'Phụ huynh đã đánh giá' : 'Chờ phụ huynh đánh giá'}
          </span>
        )}
      </div>
    </div>
  );
}

function InfoBlock({
  label,
  value,
  helper,
  icon
}: {
  label: string;
  value: string;
  helper: string;
  icon: keyof typeof Icons;
}) {
  const Icon = Icons[icon];

  return (
    <div className='rounded-md border bg-background/60 p-3'>
      <div className='text-muted-foreground flex items-center gap-1.5 text-xs'>
        <Icon className='h-3.5 w-3.5' />
        {label}
      </div>
      <p className='mt-1 truncate text-sm font-semibold'>{value}</p>
      <p className='text-muted-foreground mt-0.5 truncate text-xs'>{helper}</p>
    </div>
  );
}

function ReviewDialog({
  session,
  rating,
  hoverRating,
  comment,
  isReported,
  privateFeedback,
  isSubmitting,
  onOpenChange,
  onRatingChange,
  onHoverRatingChange,
  onCommentChange,
  onReportedChange,
  onPrivateFeedbackChange,
  onSubmit
}: {
  session: Session | null;
  rating: number;
  hoverRating: number;
  comment: string;
  isReported: boolean;
  privateFeedback: string;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onRatingChange: (value: number) => void;
  onHoverRatingChange: (value: number) => void;
  onCommentChange: (value: string) => void;
  onReportedChange: (value: boolean) => void;
  onPrivateFeedbackChange: (value: string) => void;
  onSubmit: () => void;
}) {
  if (!session) {
    return null;
  }

  return (
    <Dialog open={Boolean(session)} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[560px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Icons.pro className='text-primary h-5 w-5' />
            Đánh giá gia sư {session.tutor_name}
          </DialogTitle>
          <DialogDescription>
            Buổi học {session.subject} ngày {formatDateTime(session.scheduled_at).date}.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-5 py-2'>
          <Card className='rounded-lg py-4'>
            <CardHeader className='px-4 pb-0'>
              <CardTitle className='text-sm'>Đánh giá công khai</CardTitle>
              <CardDescription className='text-xs'>
                Nội dung này có thể hiển thị trên hồ sơ gia sư sau khi qua kiểm duyệt.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4 px-4'>
              <div className='space-y-2'>
                <Label>Xếp hạng sao</Label>
                <div className='flex items-center gap-1.5'>
                  {Array.from({ length: 5 }).map((_, index) => {
                    const value = index + 1;
                    const active = value <= (hoverRating || rating);

                    return (
                      <button
                        key={value}
                        type='button'
                        className='rounded-md p-1 transition-transform hover:scale-110'
                        onClick={() => onRatingChange(value)}
                        onMouseEnter={() => onHoverRatingChange(value)}
                        onMouseLeave={() => onHoverRatingChange(0)}
                      >
                        <Icons.pro
                          className={cn(
                            'h-7 w-7 transition-colors',
                            active
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-muted text-muted-foreground/25'
                          )}
                        />
                      </button>
                    );
                  })}
                  <span className='text-muted-foreground ml-2 text-sm font-medium'>{rating}/5</span>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='class-public-review'>Nhận xét</Label>
                <Textarea
                  id='class-public-review'
                  value={comment}
                  onChange={(event) => onCommentChange(event.target.value)}
                  placeholder='Chia sẻ về phương pháp giảng dạy, mức độ đúng giờ và tiến bộ của học sinh...'
                  className='min-h-[96px]'
                />
                <p className='text-muted-foreground text-xs'>Tối thiểu 10 ký tự.</p>
              </div>
            </CardContent>
          </Card>

          <Card className='rounded-lg border-rose-500/20 bg-rose-500/5 py-4'>
            <CardContent className='space-y-3 px-4'>
              <div className='flex items-center gap-2'>
                <Checkbox
                  id='class-private-report'
                  checked={isReported}
                  onCheckedChange={(checked) => onReportedChange(Boolean(checked))}
                />
                <Label htmlFor='class-private-report' className='cursor-pointer text-sm font-semibold'>
                  Gửi báo cáo riêng cho quản trị viên
                </Label>
              </div>

              {isReported && (
                <div className='space-y-2'>
                  <Label htmlFor='class-private-feedback'>Nội dung báo cáo</Label>
                  <Textarea
                    id='class-private-feedback'
                    value={privateFeedback}
                    onChange={(event) => onPrivateFeedbackChange(event.target.value)}
                    placeholder='Ghi rõ vấn đề cần ban quản trị hỗ trợ xử lý...'
                    className='min-h-[76px]'
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button onClick={onSubmit} isLoading={isSubmitting}>
            Gửi đánh giá
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
