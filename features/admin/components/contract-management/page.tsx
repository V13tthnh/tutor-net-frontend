'use client';
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { ContractManagementTable } from './table';

function TableSkeleton() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export function ContractManagementPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Danh sách Hợp đồng</CardTitle>
        <CardDescription>
          Theo dõi dòng tiền (phí nhận lớp), quản lý trạng thái ký hợp đồng điện tử và xử lý tranh chấp/bảo hành.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<TableSkeleton />}>
          <ContractManagementTable />
        </Suspense>
      </CardContent>
    </Card>
  );
}
