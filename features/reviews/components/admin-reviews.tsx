'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminReviewsQueryOptions } from '../api/queries';
import { toggleReviewPublicMutation } from '../api/mutations';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { useNotificationStore } from '@/features/notifications/utils/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { fakeTutors } from '@/constants/mock-api-tutors';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { parseAsInteger, useQueryStates } from 'nuqs';

export function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuthSession();
  const isLoaded = !authLoading;
  const role = user?.roles.some(r => r === 'admin' || r === 'super_admin')
    ? 'admin'
    : user?.roles.includes('tutor')
    ? 'tutor'
    : 'parent';
  const { addNotification } = useNotificationStore();

  // Fetch all reviews for admin moderation
  const { data: reviews = [], isLoading } = useQuery(
    adminReviewsQueryOptions()
  );

  // Toggle public mutation
  const toggleMutation = useMutation({
    ...toggleReviewPublicMutation,
    onSuccess: (res, variables) => {
      toast.success(variables.is_public ? 'Đã hiển thị đánh giá công khai!' : 'Đã ẩn đánh giá khỏi giao diện web.');
      
      // Invalidate queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['tutors'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });

      // Notify Tutor about moderation update
      const tutor = fakeTutors.records.find((t) => t.id === res.review.reviewee_id);
      if (tutor) {
        addNotification({
          id: Math.random().toString(),
          title: variables.is_public ? 'Đánh giá của bạn đã được duyệt hiển thị ✅' : 'Đánh giá của bạn bị ẩn bởi quản trị viên 🚫',
          body: variables.is_public 
            ? `Đánh giá từ phụ huynh ${res.review.reviewer_name} đã được quản trị viên duyệt hiển thị.` 
            : `Đánh giá từ phụ huynh ${res.review.reviewer_name} đã bị ẩn khỏi trang hồ sơ của bạn.`,
          createdAt: new Date().toISOString(),
          actions: []
        });
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Lỗi khi cập nhật trạng thái kiểm duyệt.');
    }
  });

  // URL-synced pagination params
  const [params, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(20)
  });

  const page = params.page ?? 1;
  const perPage = params.limit ?? 20;

  const total = reviews.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * perPage;
  const current = reviews.slice(start, start + perPage);

  // Columns for DataTable (defined unconditionally so hooks order is stable)
  const columns = [
    {
      id: 'reviewer',
      header: 'Người đánh giá',
      accessorFn: (row: any) => row.reviewer_name,
      cell: (info: any) => (
        <div className='flex flex-col'>
          <span className='font-semibold text-foreground'>{info.getValue()}</span>
          <span className='text-[10px] text-muted-foreground'>ID: {info.row.original.reviewer_id}</span>
        </div>
      )
    },
    {
      id: 'tutor',
      header: 'Gia sư',
      accessorFn: (row: any) => row.reviewee_id,
      cell: (info: any) => (
        <div className='flex flex-col'>
          <span className='font-semibold text-foreground'>{getTutorName(info.getValue())}</span>
          <span className='text-[10px] text-muted-foreground'>ID GS: {info.getValue()}</span>
        </div>
      )
    },
    {
      id: 'rating',
      header: 'Xếp hạng',
      accessorFn: (row: any) => row.rating,
      cell: (info: any) => (
        <div className='space-y-1'>
          <div className='flex gap-0.5'>
            {Array.from({ length: 5 }).map((_, i) => (
              <Icons.pro
                key={i}
                className={`h-3.5 w-3.5 ${i < info.getValue() ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground/20'}`}
              />
            ))}
          </div>
          <span className='text-[10px] text-muted-foreground font-semibold'>({info.getValue()} sao)</span>
        </div>
      )
    },
    {
      id: 'comment',
      header: 'Nhận xét công khai',
      accessorFn: (row: any) => row.comment,
      cell: (info: any) => (
        <p className='text-xs text-foreground leading-relaxed line-clamp-3' title={info.getValue()}>
          {info.getValue()}
        </p>
      )
    },
    {
      id: 'private',
      header: 'Báo cáo (Private)',
      accessorFn: (row: any) => ({ reported: row.is_reported, feedback: row.private_feedback }),
      cell: (info: any) => {
        const v = info.getValue();
        return v.reported ? (
          <div className='space-y-1'>
            <Badge className='bg-rose-500/10 text-rose-500 hover:bg-rose-500/25 border-rose-500/20 text-[9px] font-bold'>🚨 ĐÃ BÁO CÁO VI PHẠM</Badge>
            <p className='text-xs text-red-600 dark:text-red-400 font-medium leading-relaxed italic line-clamp-3'>"{v.feedback || 'Không ghi rõ chi tiết.'}"</p>
          </div>
        ) : (
          <span className='text-xs text-muted-foreground italic'>Không có báo cáo</span>
        );
      }
    },
    {
      id: 'status',
      header: 'Trạng thái',
      accessorFn: (row: any) => row.is_public,
      cell: (info: any) =>
        info.getValue() ? (
          <Badge className='bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-semibold'>Công khai</Badge>
        ) : (
          <Badge className='bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] font-semibold'>Đang ẩn</Badge>
        )
    },
    {
      id: 'actions',
      header: 'Kiểm duyệt',
      accessorFn: (row: any) => row,
      cell: (info: any) => {
        const row = info.getValue();
        return (
          <Button
            size='sm'
            variant={row.is_public ? 'destructive' : 'default'}
            className='h-8 text-xs font-semibold rounded-md shadow-sm'
            onClick={() => toggleMutation.mutate({ id: row.id, is_public: !row.is_public })}
            isLoading={toggleMutation.isPending && toggleMutation.variables?.id === row.id}
          >
            {row.is_public ? (
              <span className='flex items-center gap-1'>
                <Icons.eyeOff className='h-3 w-3' />Ẩn đi
              </span>
            ) : (
              <span className='flex items-center gap-1'>
                <Icons.check className='h-3 w-3' />Duyệt hiện
              </span>
            )}
          </Button>
        );
      }
    }
  ];

  const { table } = useDataTable({
    data: current,
    columns: columns as any,
    pageCount,
    initialState: { pagination: { pageIndex: safePage - 1, pageSize: perPage } },
    shallow: true
  });

  const onPaginationChange = (newPage: number, newPageSize?: number) => {
    setParams({ page: newPage, limit: newPageSize ?? perPage });
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Double check authorization
  if (role !== 'admin') {
    return (
      <Card className="border-destructive/30 bg-destructive/5 max-w-[600px] mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <Icons.warning className="h-5 w-5" />
            Yêu cầu Quyền Quản trị viên
          </CardTitle>
          <CardDescription>
            Bạn đang truy cập trang Quản lý Kiểm duyệt bằng vai trò <strong>{role === 'parent' ? 'Phụ huynh' : 'Gia sư'}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Để kiểm tra và trải nghiệm giao diện Admin, vui lòng sử dụng nút <strong>Giả lập Vai trò</strong> trên thanh công cụ Header (phía góc trên bên phải màn hình) và chọn <strong>Quản trị viên (Admin)</strong>.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics
  const totalCount = reviews.length;
  const hiddenCount = reviews.filter((r) => !r.is_public).length;
  const reportedCount = reviews.filter((r) => r.is_reported).length;

  const getTutorName = (tutorId: number) => {
    const tutor = fakeTutors.records.find((t) => t.id === tutorId);
    return tutor ? `${tutor.first_name} ${tutor.last_name}` : `Gia sư ID ${tutorId}`;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Icons.pro
            key={i}
            className={`h-3.5 w-3.5 ${i < rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground/20'}`}
          />
        ))}
      </div>
    );
  };


  // keep toggleMutation as defined earlier

  return (
    <div className="space-y-6">
      {/* Metric Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Tổng số đánh giá</CardTitle>
            <Icons.chat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">{totalCount}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Tất cả nhận xét của phụ huynh trên hệ thống</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase">Đang ẩn / Chờ duyệt</CardTitle>
            <Icons.eyeOff className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{hiddenCount}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Đánh giá bị ẩn tự động do chứa từ cấm hoặc điểm thấp</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase">Báo cáo vi phạm</CardTitle>
            <Icons.warning className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{reportedCount}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Các báo cáo cần xử lý khẩn cấp từ phụ huynh</p>
          </CardContent>
        </Card>
      </div>

      {/* Moderation Console */}
      <Card className="border-border/40 bg-card/60 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-xl">Bảng điều khiển kiểm duyệt Đánh giá</CardTitle>
          <CardDescription>
            Kiểm tra chi tiết nhận xét công khai và báo cáo ngầm. Admin có thể thay đổi trạng thái ẩn/hiện của nhận xét để đồng bộ điểm của Gia sư.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {total === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Icons.class className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <h3 className="text-sm font-semibold">Chưa có đánh giá nào</h3>
              <p className="text-xs text-muted-foreground mt-1">Không có đánh giá nào cần hiển thị.</p>
            </div>
          ) : (
            <div className='rounded-lg border'>
              <DataTable table={table}>
                <DataTableToolbar table={table} />
              </DataTable>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
