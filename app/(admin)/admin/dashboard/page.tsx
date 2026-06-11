import { DashboardFilters } from '@/features/overview/components/dashboard-filters';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter
} from '@/components/ui/card';
import { Icons } from '@/components/icons';

export default function OverviewPage() {
  return (
    <>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-2xl font-bold tracking-tight'>Tổng quan hệ thống</h2>
        <DashboardFilters />
      </div>

      <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4 mb-4'>
        {/* KPI 1: Tổng Học Sinh / Phụ Huynh */}
        <Card className='@container/card'>
          <CardHeader>
            <CardDescription>Tổng Học sinh / Phụ huynh</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
              12,450
            </CardTitle>
            <CardAction>
              <Badge variant='outline'>
                <Icons.trendingUp className="mr-1" />
                +5.2%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className='flex-col items-start gap-1.5 text-sm'>
            <div className='line-clamp-1 flex gap-2 font-medium'>
              Tăng trưởng ổn định <Icons.trendingUp className='size-4 text-green-500' />
            </div>
            <div className='text-muted-foreground'>So với tháng trước</div>
          </CardFooter>
        </Card>

        {/* KPI 2: Gia Sư Đang Hoạt Động */}
        <Card className='@container/card'>
          <CardHeader>
            <CardDescription>Gia sư hoạt động</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
              3,210
            </CardTitle>
            <CardAction>
              <Badge variant='outline'>
                <Icons.trendingUp className="mr-1" />
                +12%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className='flex-col items-start gap-1.5 text-sm'>
            <div className='line-clamp-1 flex gap-2 font-medium'>
              Vượt chỉ tiêu <Icons.trendingUp className='size-4 text-green-500' />
            </div>
            <div className='text-muted-foreground'>Đang duy trì dạy học</div>
          </CardFooter>
        </Card>

        {/* KPI 3: Lớp Yêu Cầu Mới */}
        <Card className='@container/card'>
          <CardHeader>
            <CardDescription>Số lớp yêu cầu mới</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
              854
            </CardTitle>
            <CardAction>
              <Badge variant='outline'>
                <Icons.trendingDown className="mr-1" />
                -2%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className='flex-col items-start gap-1.5 text-sm'>
            <div className='line-clamp-1 flex gap-2 font-medium'>
              Giảm nhẹ trong kỳ <Icons.trendingDown className='size-4 text-red-500' />
            </div>
            <div className='text-muted-foreground'>Cần chú ý marketing</div>
          </CardFooter>
        </Card>

        {/* KPI 4: Lớp Đã Giao & Doanh Thu */}
        <Card className='@container/card'>
          <CardHeader>
            <CardDescription>Lớp đã giao thành công</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
              640
            </CardTitle>
            <CardAction>
              <Badge variant='outline'>
                <Icons.trendingUp className="mr-1" />
                +8.5%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className='flex-col items-start gap-1.5 text-sm'>
            <div className='line-clamp-1 flex gap-2 font-medium'>
              Doanh thu: 154M VNĐ <Icons.trendingUp className='size-4 text-green-500' />
            </div>
            <div className='text-muted-foreground'>Phí nhận lớp tháng này</div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
