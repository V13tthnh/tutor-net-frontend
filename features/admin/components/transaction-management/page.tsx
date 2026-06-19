'use client';
import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, List, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { TransactionManagementTable } from './table';
import { adminTransactionSummaryQueryOptions } from '../../api/queries';
import type { TransactionFilters, TransactionStatus, PaymentMethod } from '../../api/types';

function TableSkeleton() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function TransactionSummaryCards() {
  const searchParams = useSearchParams();

  const fromDateStr = searchParams.get('fromDate') || undefined;
  const toDateStr = searchParams.get('toDate') || undefined;
  const status = searchParams.get('status') as TransactionStatus | null || undefined;
  const paymentMethod = searchParams.get('paymentMethod') as PaymentMethod | null || undefined;
  const keyword = searchParams.get('keyword') || undefined;

  const filters: TransactionFilters = useMemo(() => ({
    status,
    paymentMethod,
    search: keyword,
    fromDate: fromDateStr,
    toDate: toDateStr,
  }), [status, paymentMethod, keyword, fromDateStr, toDateStr]);

  const { data: summary, isLoading } = useQuery(adminTransactionSummaryQueryOptions(filters));

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="py-4">
              <div className="h-4 w-20 bg-muted rounded mb-2" />
              <div className="h-7 w-28 bg-muted rounded" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  const kpis = summary || {
    totalCount: 0,
    successCount: 0,
    pendingCount: 0,
    failedCount: 0,
    totalRevenue: 0,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* Doanh thu thực tế */}
      <Card className="bg-gradient-to-t from-emerald-500/5 to-card dark:from-emerald-500/10">
        <CardHeader className="py-4">
          <CardDescription className="flex items-center gap-1.5 font-medium text-xs">
            Doanh thu thực tế
            <DollarSign className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          </CardDescription>
          <CardTitle className="text-xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatMoney(kpis.totalRevenue)}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Tổng giao dịch */}
      <Card className="bg-gradient-to-t from-primary/5 to-card">
        <CardHeader className="py-4">
          <CardDescription className="flex items-center gap-1.5 font-medium text-xs">
            Tổng giao dịch
            <List className="h-3.5 w-3.5 text-primary shrink-0" />
          </CardDescription>
          <CardTitle className="text-xl font-bold font-mono tracking-tight text-foreground">
            {kpis.totalCount}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Giao dịch thành công */}
      <Card className="bg-gradient-to-t from-green-500/5 to-card">
        <CardHeader className="py-4">
          <CardDescription className="flex items-center gap-1.5 font-medium text-xs">
            Thành công
            <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
          </CardDescription>
          <CardTitle className="text-xl font-bold font-mono tracking-tight text-green-600 dark:text-green-400">
            {kpis.successCount}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Giao dịch đang chờ */}
      <Card className="bg-gradient-to-t from-amber-500/5 to-card">
        <CardHeader className="py-4">
          <CardDescription className="flex items-center gap-1.5 font-medium text-xs">
            Đang xử lý
            <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          </CardDescription>
          <CardTitle className="text-xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400">
            {kpis.pendingCount}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Giao dịch thất bại / Hủy */}
      <Card className="bg-gradient-to-t from-red-500/5 to-card">
        <CardHeader className="py-4">
          <CardDescription className="flex items-center gap-1.5 font-medium text-xs">
            Thất bại / Hủy
            <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
          </CardDescription>
          <CardTitle className="text-xl font-bold font-mono tracking-tight text-red-600 dark:text-red-400">
            {kpis.failedCount}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

export function TransactionManagementPage() {
  return (
    <div className="space-y-6 font-sans">
      <Suspense fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="py-4">
                <div className="h-4 w-20 bg-muted rounded mb-2" />
                <div className="h-7 w-28 bg-muted rounded" />
              </CardHeader>
            </Card>
          ))}
        </div>
      }>
        <TransactionSummaryCards />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Giao dịch</CardTitle>
          <CardDescription>
            Giám sát các khoản đóng phí nhận lớp của gia sư, tra cứu thông tin cổng thanh toán Gateway.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<TableSkeleton />}>
            <TransactionManagementTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
