'use client';
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { TutorInvitationManagementTable } from './table';

function TableSkeleton() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export function TutorInvitationManagementPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Danh sách lời mời Gia sư</CardTitle>
        <CardDescription>
          Xem và quản lý các lời mời đích danh giữa Phụ huynh và Gia sư. Admin có thể hủy lời mời vi phạm quy định.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<TableSkeleton />}>
          <TutorInvitationManagementTable />
        </Suspense>
      </CardContent>
    </Card>
  );
}
