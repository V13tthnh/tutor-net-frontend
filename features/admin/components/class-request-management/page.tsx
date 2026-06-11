'use client';
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { ClassRequestManagementTable } from './table';

function TableSkeleton() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export function ClassRequestManagementPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Danh sách yêu cầu lớp học</CardTitle>
        <CardDescription>
          Duyệt các yêu cầu lớp học chờ xác nhận hoặc xem các yêu cầu đã xử lý
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<TableSkeleton />}>
          <ClassRequestManagementTable />
        </Suspense>
      </CardContent>
    </Card>
  );
}
