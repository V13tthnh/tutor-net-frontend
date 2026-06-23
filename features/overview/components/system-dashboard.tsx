'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DateRange } from 'react-day-picker';
import { useQuery } from '@tanstack/react-query';
import { dashboardQueryOptions } from '../api/queries';
import { BarGraphSkeleton } from './bar-graph-skeleton';
import { PieGraphSkeleton } from './pie-graph-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  LabelList,
} from 'recharts';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

// ─── Constants & Types ────────────────────────────────────────────────────────
type Granularity = 'day' | 'week' | 'month' | 'year';

const PRESET_OPTIONS = [
  { label: 'Hôm nay', value: 'today' },
  { label: 'Tuần này', value: '7days' },
  { label: 'Tháng này', value: 'month' },
  { label: 'Năm nay', value: 'year' },
];

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

const comboChartConfig = {
  revenue: {
    label: 'Doanh thu',
    color: 'var(--chart-1)'
  },
  contracts: {
    label: 'Hợp đồng',
    color: 'var(--chart-2)'
  }
} satisfies ChartConfig;

const doughnutChartConfig = {
  matched: {
    label: 'Đã ghép lớp',
    color: '#10b981'
  },
  approved: {
    label: 'Đã duyệt',
    color: '#06b6d4'
  },
  processing: {
    label: 'Đang xử lý',
    color: '#3b82f6'
  },
  pending: {
    label: 'Chờ duyệt',
    color: '#f59e0b'
  },
  cancelled: {
    label: 'Đã hủy',
    color: '#ef4444'
  },
  rejected: {
    label: 'Đã từ chối',
    color: '#94a3b8'
  }
} satisfies ChartConfig;

const CustomHatchedBar = (
  props: React.SVGProps<SVGRectElement> & {
    dataKey?: string;
    isHatched?: boolean;
  }
) => {
  const { fill, x, y, width, height, dataKey } = props;

  const isHatched = props.isHatched ?? true;

  return (
    <>
      <rect
        rx={4}
        x={x}
        y={y}
        width={width}
        height={height}
        stroke='none'
        fill={isHatched ? `url(#hatched-bar-pattern-${dataKey})` : fill}
      />
      <defs>
        <pattern
          key={dataKey}
          id={`hatched-bar-pattern-${dataKey}`}
          x='0'
          y='0'
          width='5'
          height='5'
          patternUnits='userSpaceOnUse'
          patternTransform='rotate(-45)'
        >
          <rect width='10' height='10' opacity={0.5} fill={fill}></rect>
          <rect width='1' height='10' fill={fill}></rect>
        </pattern>
      </defs>
    </>
  );
};

const DottedBackgroundPattern = () => {
  return (
    <pattern
      id='default-multiple-pattern-dots'
      x='0'
      y='0'
      width='10'
      height='10'
      patternUnits='userSpaceOnUse'
    >
      <circle className='dark:text-muted/40 text-muted' cx='2' cy='2' r='1' fill='currentColor' />
    </pattern>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatMoney(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function SystemDashboard() {
  const router = useRouter();

  // ─── State ──────────────────────────────────────────────────────────────────
  const [preset, setPreset] = useState<string>('30days');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 30);
    return { from, to };
  });
  const [granularity, setGranularity] = useState<Granularity>('day');

  // Modal State for action items
  const [selectedReview, setSelectedReview] = useState<any | null>(null);

  // ─── UX logic for presets and granularity auto-adjust ────────────────────────
  const handlePresetSelect = (p: string) => {
    setPreset(p);
    const to = new Date();
    const from = new Date();

    if (p === 'today') {
      from.setHours(0, 0, 0, 0);
      setDateRange({ from, to });
      setGranularity('day');
    } else if (p === '7days') {
      from.setDate(to.getDate() - 7);
      setDateRange({ from, to });
      setGranularity('week');
    } else if (p === '30days') {
      from.setDate(to.getDate() - 30);
      setDateRange({ from, to });
      setGranularity('month');
    } else if (p === 'month') {
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
      setDateRange({ from, to });
      setGranularity('month');
    } else if (p === 'year') {
      from.setMonth(0, 1);
      from.setHours(0, 0, 0, 0);
      setDateRange({ from, to });
      setGranularity('year');
    }
  };

  const handleCustomDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    setPreset('custom');
    if (range?.from && range?.to) {
      const diffTime = Math.abs(range.to.getTime() - range.from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) {
        setGranularity('day');
      } else if (diffDays <= 45) {
        setGranularity('week');
      } else if (diffDays <= 365) {
        setGranularity('month');
      } else {
        setGranularity('year');
      }
    }
  };

  const isGranularityDisabled = (g: Granularity) => {
    if (!dateRange?.from || !dateRange?.to) return false;
    const diffTime = Math.abs(dateRange.to.getTime() - dateRange.from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) {
      return g === 'month' || g === 'year';
    }
    if (diffDays <= 30) {
      return g === 'year';
    }
    if (diffDays > 120) {
      return g === 'day' || g === 'week';
    }
    return false;
  };

  const fromDateStr = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
  const toDateStr = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

  const { data: dashboardData, isLoading } = useQuery(
    dashboardQueryOptions({
      fromDate: fromDateStr,
      toDate: toDateStr,
      interval: granularity
    })
  );

  // ─── Dynamic Mock Data Generator ───────────────────────────────────────────
  const kpiData = useMemo(() => {
    if (!dashboardData?.kpis) {
      return {
        revenue: 0,
        classRequests: 0,
        matchRate: 0,
        tutors: 0,
        tutorsPending: 0
      };
    }
    return {
      revenue: dashboardData.kpis.totalRevenue,
      classRequests: dashboardData.kpis.totalClassRequests,
      matchRate: dashboardData.kpis.matchRate,
      tutors: dashboardData.kpis.newTutors,
      tutorsPending: dashboardData.kpis.pendingTutorsCount
    };
  }, [dashboardData]);

  const comboChartData = useMemo(() => {
    return (dashboardData?.timeSeriesChart || []).map(item => ({
      timePeriod: item.timePeriod,
      revenue: item.revenue,
      contracts: item.contractCount
    }));
  }, [dashboardData]);

  const classStatusData = useMemo(() => {
    const apiStatus = dashboardData?.classStatus || [];
    
    // Define exactly the 6 statuses from ClassRequestStatus enum in order
    const allStatuses = ['pending', 'approved', 'processing', 'matched', 'cancelled', 'rejected'];
    
    // Build maps with default count = 0
    const statusCounts: Record<string, number> = {};
    allStatuses.forEach(s => {
      statusCounts[s] = 0;
    });
    
    // Accumulate actual counts
    apiStatus.forEach(item => {
      const statusKey = item.categoryName.toLowerCase();
      if (allStatuses.includes(statusKey)) {
        statusCounts[statusKey] = item.count;
      }
    });

    const fillMap: Record<string, string> = {
      matched: '#10b981',
      approved: '#06b6d4',
      processing: '#3b82f6',
      pending: '#f59e0b',
      cancelled: '#ef4444',
      rejected: '#94a3b8'
    };

    return allStatuses.map(status => ({
      status,
      value: statusCounts[status],
      fill: fillMap[status]
    }));
  }, [dashboardData]);

  const isAllZero = useMemo(() => {
    return classStatusData.every((d) => d.value === 0);
  }, [classStatusData]);

  const pieData = useMemo(() => {
    if (isAllZero) {
      return [{ status: 'placeholder', value: 1, fill: 'hsl(var(--muted))' }];
    }
    return classStatusData.filter((d) => d.value > 0);
  }, [classStatusData, isAllZero]);

  const pendingTutors = useMemo(() => {
    return (dashboardData?.pendingTutors || []).map(t => ({
      id: t.id,
      name: t.fullName,
      email: t.email,
      appliedAt: t.createdAt,
      education: 'Chờ duyệt hồ sơ',
      subjects: [] as string[]
    }));
  }, [dashboardData]);

  const overdueContracts = useMemo(() => {
    return (dashboardData?.overdueContracts || []).map(c => {
      const delayDays = c.deadline
        ? Math.max(0, Math.ceil((Date.now() - new Date(c.deadline).getTime()) / (1000 * 60 * 60 * 24)))
        : 0;
      return {
        id: c.id,
        contractNumber: c.contractNumber,
        studentName: 'Phụ huynh học viên',
        phone: '-',
        deadline: c.deadline,
        fee: c.amount,
        delayDays
      };
    });
  }, [dashboardData]);

  const negativeReviews = useMemo(() => {
    return (dashboardData?.negativeReviews || []).map(r => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      reviewerName: 'Phụ huynh ẩn danh',
      tutorName: r.tutorName,
      contractNumber: '-',
      createdAt: '-'
    }));
  }, [dashboardData]);

  const popularSubjectsData = useMemo(() => {
    const apiSubjects = dashboardData?.topSubjects || [];
    const colors = [
      'var(--chart-1)',
      'var(--chart-2)',
      'var(--chart-3)',
      'var(--chart-4)',
      'var(--chart-5)'
    ];
    return apiSubjects.map((item, index) => ({
      subject: item.categoryName,
      count: item.count,
      color: colors[index % colors.length]
    }));
  }, [dashboardData]);

  const maxSubjectCount = useMemo(() => {
    if (popularSubjectsData.length === 0) return 1;
    return Math.max(...popularSubjectsData.map(d => d.count));
  }, [popularSubjectsData]);

  return (
    <div className="space-y-6">

      {/* ─── Global Filter Bar (Sticky at Top) ───────────────────────────────── */}
      <div className="sticky top-0 z-30 flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border rounded-xl bg-card/95 backdrop-blur-md shadow-md">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icons.adjustments className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground leading-none">Bộ lọc hệ thống</h3>
            <p className="text-[10px] text-muted-foreground mt-1">Dữ liệu được áp dụng toàn thời gian</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* Preset Buttons */}
          <div className="flex items-center rounded-lg border p-0.5 bg-muted/30">
            {PRESET_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => handlePresetSelect(o.value)}
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap',
                  preset === o.value
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* Date Picker Custom */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'h-8 text-xs font-semibold gap-1.5',
                  preset === 'custom' && 'border-primary text-primary'
                )}
              >
                <Icons.calendar className="h-3.5 w-3.5" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    `${format(dateRange.from, 'dd/MM')} - ${format(dateRange.to, 'dd/MM')}`
                  ) : (
                    format(dateRange.from, 'dd/MM')
                  )
                ) : (
                  'Tùy chọn'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={handleCustomDateSelect}
                numberOfMonths={2}
                locale={vi}
              />
            </PopoverContent>
          </Popover>


        </div>
      </div>

      {isLoading ? (
        <>
          {/* ─── KPI Cards Skeleton ──────────────────────────────────────────────── */}
          <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="@container/card">
                <CardHeader>
                  <CardDescription className="flex items-center gap-1.5 font-medium text-xs">
                    <Skeleton className="h-4 w-24" />
                  </CardDescription>
                  <CardTitle className="text-2xl font-semibold tracking-tight tabular-nums">
                    <Skeleton className="h-8 w-32" />
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* ─── Data Visualizations Skeleton ────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8">
              <BarGraphSkeleton />
            </div>
            <div className="lg:col-span-4">
              <PieGraphSkeleton />
            </div>
          </div>

          {/* ─── Actionable Items & Alert Tables Skeleton ────────────────────────── */}
          <div className="space-y-6">
            <Card className="shadow-sm border">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-8 w-24" />
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                    <Skeleton className="h-7 w-20" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
              <Card className="col-span-4 shadow-sm border p-4 flex flex-col justify-between space-y-4 min-h-[350px]">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-60" />
                </div>
                <div className="space-y-3 flex-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-2">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="col-span-3 shadow-sm border p-4 flex flex-col justify-between space-y-4 min-h-[350px]">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-60" />
                </div>
                <div className="space-y-3 flex-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* ─── KPI Cards ──────────────────────────────────────────────────────── */}
          <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-4">
            {/* KPI 1: Gross Revenue */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription className="flex items-center gap-1.5 font-medium text-xs">
                  Doanh thu tổng
                  <Icons.settingsDollar className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                </CardDescription>
                <CardTitle className="text-2xl font-semibold font-mono tracking-tight tabular-nums @[250px]/card:text-3xl text-emerald-600 dark:text-emerald-400">
                  {formatMoney(kpiData.revenue)}
                </CardTitle>
              </CardHeader>
            </Card>

            {/* KPI 2: Class Requests */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription className="flex items-center gap-1.5 font-medium text-xs">
                  Lớp yêu cầu mới
                  <Icons.class className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                </CardDescription>
                <CardTitle className="text-2xl font-semibold font-mono tracking-tight tabular-nums @[250px]/card:text-3xl text-blue-600 dark:text-blue-400">
                  {kpiData.classRequests}
                </CardTitle>
              </CardHeader>
            </Card>

            {/* KPI 3: Match Rate */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription className="flex items-center gap-1.5 font-medium text-xs">
                  Tỷ lệ ghép lớp
                  <Icons.circleCheck className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                </CardDescription>
                <CardTitle className="text-2xl font-semibold font-mono tracking-tight tabular-nums @[250px]/card:text-3xl text-purple-600 dark:text-purple-400">
                  {kpiData.matchRate}%
                </CardTitle>
              </CardHeader>
            </Card>

            {/* KPI 4: New Tutors */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription className="flex items-center gap-1.5 font-medium text-xs">
                  Gia sư mới
                  <Icons.users className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                </CardDescription>
                <CardTitle className="text-2xl font-semibold font-mono tracking-tight tabular-nums @[250px]/card:text-3xl text-amber-600 dark:text-amber-400">
                  {kpiData.tutors}
                  <span className="text-xs font-semibold text-muted-foreground ml-1.5 block sm:inline">
                    ({kpiData.tutorsPending} chờ duyệt)
                  </span>
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* ─── Data Visualizations (Max 3 Charts) ───────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Chart 1: Combo Chart - Doanh thu & Hợp đồng (8 columns) */}
            <Card className="lg:col-span-8 shadow-sm border flex flex-col">
              <CardHeader>
                <CardTitle className="flex justify-between items-center text-sm font-bold">
                  Dòng tiền & Tăng trưởng hợp đồng
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-bold text-primary bg-primary/5 border-primary/20">
                    Theo {granularity === 'day' ? 'Ngày' : granularity === 'week' ? 'Tuần' : granularity === 'month' ? 'Tháng' : 'Năm'}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  So sánh tổng doanh thu phí nhận lớp (Cột) và số hợp đồng được ký kết (Đường)
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-[320px] w-full pt-4 flex items-center justify-center">
                {comboChartData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-muted-foreground text-center p-8">
                    <Icons.settingsDollar className="h-10 w-10 text-muted/40 mb-2" />
                    <p className="text-xs font-semibold text-foreground">Không có dữ liệu dòng tiền</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Không có giao dịch hoặc hợp đồng nào được ghi nhận trong khoảng thời gian này.</p>
                  </div>
                ) : (
                  <ChartContainer config={comboChartConfig} className="aspect-auto h-[320px] w-full">
                    <ComposedChart data={comboChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                      <rect
                        x="0"
                        y="0"
                        width="100%"
                        height="85%"
                        fill="url(#default-multiple-pattern-dots)"
                      />
                      <defs>
                        <DottedBackgroundPattern />
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="timePeriod"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <YAxis
                        yAxisId="left"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(val) => `${val / 1000000}M`}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <ChartTooltip
                        cursor={false}
                        position={{ y: 10 }}
                        content={
                          <ChartTooltipContent
                            indicator="dashed"
                            formatter={(value, name) => {
                              const label = name === 'revenue' ? 'Doanh thu' : 'Hợp đồng';
                              const color = name === 'revenue' ? 'var(--color-revenue)' : 'var(--color-contracts)';
                              const formattedValue = name === 'revenue' ? formatMoney(Number(value)) : `${value} bản`;
                              return (
                                <div className="flex flex-1 items-center justify-between gap-6 text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                                    <span className="text-muted-foreground">{label}</span>
                                  </div>
                                  <span className="font-mono font-semibold text-foreground">{formattedValue}</span>
                                </div>
                              );
                            }}
                          />
                        }
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="revenue"
                        fill="var(--color-revenue)"
                        shape={<CustomHatchedBar isHatched={false} />}
                        radius={4}
                        maxBarSize={35}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="contracts"
                        stroke="var(--color-contracts)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </ComposedChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Chart 2: Doughnut Chart - Trạng thái Yêu cầu lớp (4 columns) */}
            <Card className="lg:col-span-4 shadow-sm border flex flex-col ">
              <CardHeader className="pb-0">
                <CardTitle className="text-sm font-bold">Trạng thái Yêu cầu lớp</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Phân bổ tỷ lệ các class request hiện tại</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 items-center justify-center p-0 pb-0 min-h-[220px]">
                <ChartContainer
                  config={doughnutChartConfig}
                  className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[200px] w-full"
                >
                  <PieChart>
                    <ChartTooltip 
                      content={
                        isAllZero 
                          ? () => null 
                          : <ChartTooltipContent nameKey="status" hideLabel />
                      } 
                    />
                    <Pie
                      data={pieData}
                      innerRadius={30}
                      dataKey="value"
                      nameKey="status"
                      radius={10}
                      cornerRadius={8}
                      paddingAngle={isAllZero ? 0 : 4}
                    >
                      {!isAllZero && (
                        <LabelList
                          dataKey="value"
                          stroke="none"
                          fontSize={11}
                          fontWeight={500}
                          fill="currentColor"
                          formatter={(value: any) => String(value)}
                        />
                      )}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className="pb-4 pt-0 flex-col items-stretch gap-2.5">
                <Separator />
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs font-semibold">
                  {classStatusData.map((item) => {
                    const configItem = doughnutChartConfig[item.status as keyof typeof doughnutChartConfig];
                    return (
                      <div key={item.status} className="flex items-center gap-1.5 truncate">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className="text-muted-foreground truncate">{configItem?.label || item.status}</span>
                        <span className="font-normal ml-auto text-foreground">{item.value}</span>
                      </div>
                    );
                  })}
                </div>
              </CardFooter>
            </Card>

          </div>

          {/* ─── Actionable Items & Alert Tables (Unaffected by date filter) ─────── */}
          <div className="space-y-6">

            {/* Table 1: Tutor applicants pending review (Wide, 1 Column) */}
            <Card className="shadow-sm border">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    Hồ sơ gia sư chờ duyệt
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 font-bold dark:bg-amber-950/20 dark:text-amber-400">
                      {pendingTutors.length} hồ sơ mới
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1">
                    Các đăng ký làm gia sư mới đang chờ xét duyệt CV và hồ sơ thông tin
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-bold gap-1 cursor-pointer"
                  onClick={() => router.push(`/admin/tutors`)}
                >
                  Xem tất cả
                  <Icons.chevronRight className="h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="p-0 overflow-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/30 text-[10px] uppercase font-bold text-muted-foreground">
                      <th className="px-4 py-3">Gia sư</th>
                      <th className="px-4 py-3">Học văn</th>
                      <th className="px-4 py-3">Môn dạy đăng ký</th>
                      <th className="px-4 py-3">Ngày nộp hồ sơ</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pendingTutors.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-muted-foreground font-medium">
                          <div className="flex flex-col items-center justify-center">
                            <Icons.circleCheck className="h-8 w-8 text-emerald-500 mb-2 animate-bounce" />
                            <p className="text-xs font-semibold text-foreground">Tuyệt vời!</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Không có hồ sơ gia sư nào đang chờ duyệt.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pendingTutors.map((t) => (
                        <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={`https://api.slingacademy.com/public/sample-users/${t.id % 10 + 1}.png`} alt={t.name} />
                                <AvatarFallback>{t.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-semibold text-foreground text-xs">{t.name}</span>
                                <span className="text-[10px] text-muted-foreground">{t.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground font-medium">{t.education}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {t.subjects?.map((sub) => (
                                <Badge key={sub} variant="secondary" className="text-[9px] px-1.5 py-0 font-medium">
                                  {sub}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground font-mono">
                            {new Date(t.appliedAt).toLocaleDateString('vi-VN')} {new Date(t.appliedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs font-bold text-primary hover:bg-primary/10 cursor-pointer"
                              onClick={() => router.push(`/admin/tutors`)}
                            >
                              Duyệt hồ sơ
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* 2 Columns Grid for Overdue Contracts and Negative Reviews */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">

              {/* List 1: Overdue contracts fee */}
              <Card className="col-span-4 shadow-sm border flex flex-col justify-between">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-red-600 dark:text-red-400">
                      Hợp đồng quá hạn nợ phí
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1">
                      Hợp đồng chưa đóng phí sau hạn thanh toán
                    </CardDescription>
                  </div>
                  <Badge variant="destructive" className="text-[10px] font-bold">
                    {overdueContracts.length} HĐ
                  </Badge>
                </CardHeader>
                <CardContent className="py-2 flex-1 flex flex-col justify-center">
                  {overdueContracts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
                      <Icons.circleCheck className="h-8 w-8 text-emerald-500 mb-2 animate-bounce" />
                      <p className="text-xs font-semibold text-foreground">Hợp đồng an toàn</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Không ghi nhận hợp đồng nào quá hạn nợ phí.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {overdueContracts.slice(0, 6).map((c) => (
                        <div key={c.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors font-sans">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 shrink-0 rounded-lg bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center">
                              <Icons.settingsDollar className="h-4 w-4" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold font-mono text-foreground">{c.contractNumber}</p>
                              <p className="text-[10px] text-muted-foreground flex flex-wrap gap-1 items-center">
                                <span className="font-medium text-foreground">{c.studentName}</span>
                                <span>•</span>
                                <span className="font-mono text-red-600 dark:text-red-400 font-semibold">{formatMoney(c.fee)}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge variant="outline" className="text-[9px] border-red-200 text-red-700 bg-red-50/50 font-bold whitespace-nowrap dark:bg-red-950/20 dark:text-red-400 dark:border-red-950/50">
                              Trễ {c.delayDays}n
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-amber-600 hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-950/50 cursor-pointer"
                              title="Gửi email nhắc nhở"
                              onClick={() => toast.success(`Đã gửi email nhắc nhở cho phụ huynh của hợp đồng ${c.contractNumber}`)}
                            >
                              <Icons.notification className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-red-600 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950/50 cursor-pointer"
                              title="Hủy hợp đồng"
                              onClick={() => toast.error(`Đề xuất hủy hợp đồng ${c.contractNumber} đã được ghi nhận`)}
                            >
                              <Icons.circleX className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="py-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-8 text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
                    onClick={() => router.push('/admin/contracts')}
                  >
                    Xem tất cả hợp đồng quá hạn
                    <Icons.chevronRight className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>

              {/* List 2: New negative reviews (1-3 stars) */}
              <Card className="col-span-3 shadow-sm border flex flex-col justify-between">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      Đánh giá tiêu cực mới nhất
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1">
                      Đánh giá không tốt cần chăm sóc khách hàng ngay
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200 font-bold dark:bg-red-950/20 dark:text-red-400">
                    1-3 sao
                  </Badge>
                </CardHeader>
                <CardContent className="py-2 flex-1 flex flex-col justify-center">
                  {negativeReviews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
                      <Icons.circleCheck className="h-8 w-8 text-emerald-500 mb-2 animate-bounce" />
                      <p className="text-xs font-semibold text-foreground">Độ hài lòng tối đa</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Chưa có đánh giá tiêu cực (1-3 sao) nào.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {negativeReviews.slice(0, 5).map((r) => (
                        <div key={r.id} className="flex items-start justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage src={`https://api.slingacademy.com/public/sample-users/${r.id % 10 + 6}.png`} alt={r.reviewerName} />
                              <AvatarFallback>{r.reviewerName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-xs font-bold text-foreground truncate">{r.reviewerName}</p>
                                <div className="flex gap-0.5 shrink-0">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Icons.exclusive
                                      key={i}
                                      className={cn(
                                        'h-2.5 w-2.5 flex-shrink-0',
                                        i < r.rating ? 'fill-amber-500 text-amber-500' : 'fill-muted text-muted-foreground/20'
                                      )}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-[10px] text-muted-foreground truncate">
                                GS: <span className="font-semibold text-foreground">{r.tutorName}</span>
                                <span className="mx-1">•</span>
                                <span className="font-mono">{r.contractNumber}</span>
                              </p>
                              <p className="text-[10px] text-muted-foreground leading-relaxed italic line-clamp-2">
                                "{r.comment.length > 60 ? `${r.comment.slice(0, 60)}...` : r.comment}"
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs font-bold text-primary hover:bg-primary/10 hover:text-primary cursor-pointer shrink-0"
                            onClick={() => setSelectedReview(r)}
                          >
                            Chi tiết
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="py-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-8 text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
                    onClick={() => router.push('/admin/reviews')}
                  >
                    Xem tất cả đánh giá tiêu cực
                    <Icons.chevronRight className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>

          {/* ─── Detail Dialog for negative reviews ──────────────────────────────── */}
          <Dialog open={!!selectedReview} onOpenChange={(o) => !o && setSelectedReview(null)}>
            <DialogContent className="max-w-md rounded-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base font-bold">
                  <Icons.chat className="h-5 w-5 text-red-500" />
                  Chi tiết phản hồi tiêu cực
                </DialogTitle>
              </DialogHeader>

              {selectedReview && (
                <div className="space-y-4 text-xs mt-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-muted-foreground">Số sao:</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Icons.exclusive
                          key={i}
                          className={cn(
                            'h-3.5 w-3.5 flex-shrink-0',
                            i < selectedReview.rating ? 'fill-amber-500 text-amber-500' : 'fill-muted text-muted-foreground/20'
                          )}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-amber-600">({selectedReview.rating} sao)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 bg-muted/20 border rounded-lg">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground block uppercase">Hợp đồng</span>
                      <span className="font-mono font-bold text-primary">{selectedReview.contractNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground block uppercase">Ngày đánh giá</span>
                      <span className="font-medium text-foreground">{selectedReview.createdAt}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground block uppercase">Người đánh giá</span>
                      <span className="font-bold text-foreground">{selectedReview.reviewerName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground block uppercase">Gia sư liên quan</span>
                      <span className="font-bold text-foreground">{selectedReview.tutorName}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground block uppercase mb-1">Nội dung nhận xét</span>
                    <p className="p-3 border rounded-lg bg-red-500/5 text-foreground leading-relaxed italic text-xs">
                      "{selectedReview.comment}"
                    </p>
                  </div>
                </div>
              )}

              <DialogFooter className="mt-4">
                <Button size="sm" variant="outline" onClick={() => setSelectedReview(null)}>
                  Đóng
                </Button>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/95 text-white"
                  onClick={() => {
                    toast.success('Đã tạo phiếu chăm sóc khách hàng cho trường hợp này.');
                    setSelectedReview(null);
                  }}
                >
                  Liên hệ xử lý
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

    </div>
  );
}
