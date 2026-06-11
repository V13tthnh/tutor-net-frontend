'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { subjectStatsQueryOptions } from '../api/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';

export function SubjectStatistics() {
  const { data } = useSuspenseQuery(subjectStatsQueryOptions());

  const stats = [
    {
      label: 'Tổng môn học',
      value: data.totalSubjects,
      sub: 'Trong toàn hệ thống',
      icon: Icons.book,
      color: 'text-blue-500'
    },
    {
      label: 'Đang hoạt động',
      value: data.activeSubjects,
      sub: `${data.totalSubjects > 0 ? Math.round((data.activeSubjects / data.totalSubjects) * 100) : 0}% tổng số`,
      icon: Icons.circleCheck,
      color: 'text-green-500'
    },
    {
      label: 'Đang ẩn',
      value: data.inactiveSubjects,
      sub: 'Không hiển thị với người dùng',
      icon: Icons.eyeOff,
      color: 'text-muted-foreground'
    }
  ];

  return (
    <div className='grid gap-4 sm:grid-cols-3'>
      {stats.map((stat) => (
        <Card key={stat.label} className='overflow-hidden'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>{stat.label}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stat.value}</div>
            <p className='text-xs text-muted-foreground mt-0.5'>{stat.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SubjectStatisticsSkeleton() {
  return (
    <div className='grid gap-4 sm:grid-cols-3'>
      <Skeleton className='h-[100px] w-full rounded-xl' />
      <Skeleton className='h-[100px] w-full rounded-xl' />
      <Skeleton className='h-[100px] w-full rounded-xl' />
    </div>
  );
}
