'use client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { userStatsQueryOptions } from '../api/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';

export function UserStatistics() {
  const { data } = useSuspenseQuery(userStatsQueryOptions());

  if (!data?.success) return null;

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng số quản trị viên</CardTitle>
          <Icons.users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalUsers}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
          <Icons.user className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.activeUsers}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tạm ngưng / Chưa kích hoạt</CardTitle>
          <Icons.employee className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.inactiveUsers}</div>
        </CardContent>
      </Card>
    </div>
  );
}

export function UserStatisticsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      <div className="h-28 rounded-xl bg-muted animate-pulse" />
      <div className="h-28 rounded-xl bg-muted animate-pulse" />
      <div className="h-28 rounded-xl bg-muted animate-pulse" />
    </div>
  );
}
