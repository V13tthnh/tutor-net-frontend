'use client';

import { Bar, BarChart, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';

const chartData = [
  { month: 'Jan', requested: 186, matched: 80 },
  { month: 'Feb', requested: 305, matched: 200 },
  { month: 'Mar', requested: 237, matched: 120 },
  { month: 'Apr', requested: 173, matched: 110 },
  { month: 'May', requested: 209, matched: 130 },
  { month: 'Jun', requested: 254, matched: 140 },
  { month: 'Jul', requested: 310, matched: 200 },
  { month: 'Aug', requested: 450, matched: 310 },
  { month: 'Sep', requested: 380, matched: 250 },
  { month: 'Oct', requested: 420, matched: 280 },
  { month: 'Nov', requested: 510, matched: 350 },
  { month: 'Dec', requested: 480, matched: 330 },
];

const chartConfig = {
  requested: {
    label: 'Yêu cầu mới',
    color: 'var(--chart-1)'
  },
  matched: {
    label: 'Giao thành công',
    color: 'var(--chart-2)'
  }
} satisfies ChartConfig;

export function BarGraph() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Tỷ lệ nhận lớp
          <Badge variant='outline' className="ml-2 text-green-500">
            <Icons.trendingUp className="mr-1 size-4" />
            +12.5%
          </Badge>
        </CardTitle>
        <CardDescription>Số lớp yêu cầu mới so với số lớp đã giao trong năm nay</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <rect
              x='0'
              y='0'
              width='100%'
              height='85%'
              fill='url(#default-multiple-pattern-dots)'
            />
            <defs>
              <DottedBackgroundPattern />
            </defs>
            <XAxis
              dataKey='month'
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='dashed' />}
            />
            <Bar
              dataKey='requested'
              color='var(--chart-1)'
              fill='var(--color-requested)'
              shape={<CustomHatchedBar isHatched={false} />}
              radius={4}
            />
            <Bar
              dataKey='matched'
              fill='var(--color-matched)'
              shape={<CustomHatchedBar />}
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

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
