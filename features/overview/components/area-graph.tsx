'use client';

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import React from 'react';

const chartData = [
  { month: 'Jan', students: 120, tutors: 45 },
  { month: 'Feb', students: 250, tutors: 80 },
  { month: 'Mar', students: 310, tutors: 110 },
  { month: 'Apr', students: 420, tutors: 150 },
  { month: 'May', students: 500, tutors: 190 },
  { month: 'Jun', students: 680, tutors: 240 },
  { month: 'Jul', students: 850, tutors: 310 },
  { month: 'Aug', students: 920, tutors: 350 },
  { month: 'Sep', students: 1100, tutors: 410 },
  { month: 'Oct', students: 1250, tutors: 480 },
  { month: 'Nov', students: 1400, tutors: 530 },
  { month: 'Dec', students: 1650, tutors: 600 }
];

const chartConfig = {
  students: {
    label: 'Học sinh mới',
    color: 'var(--chart-1)'
  },
  tutors: {
    label: 'Gia sư mới',
    color: 'var(--chart-2)'
  }
} satisfies ChartConfig;

export function AreaGraph() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Tốc độ tăng trưởng
          <Badge variant='outline' className="ml-2 text-green-500">
            <Icons.trendingUp className="mr-1 size-4" />
            +18.2%
          </Badge>
        </CardTitle>
        <CardDescription>Số lượng học sinh và gia sư đăng ký mới trong 12 tháng qua</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} strokeDasharray='3 3' />
            <XAxis
              dataKey='month'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <DottedBackgroundPattern config={chartConfig} />
            </defs>
            <Area
              dataKey='tutors'
              type='natural'
              fill='url(#dotted-background-pattern-tutors)'
              fillOpacity={0.4}
              stroke='var(--color-tutors)'
              stackId='a'
              strokeWidth={0.8}
            />
            <Area
              dataKey='students'
              type='natural'
              fill='url(#dotted-background-pattern-students)'
              fillOpacity={0.4}
              stroke='var(--color-students)'
              stackId='a'
              strokeWidth={0.8}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const DottedBackgroundPattern = ({ config }: { config: ChartConfig }) => {
  const items = Object.fromEntries(
    Object.entries(config).map(([key, value]) => [key, value.color])
  );
  return (
    <>
      {Object.entries(items).map(([key, value]) => (
        <pattern
          key={key}
          id={`dotted-background-pattern-${key}`}
          x='0'
          y='0'
          width='7'
          height='7'
          patternUnits='userSpaceOnUse'
        >
          <circle cx='5' cy='5' r='1.5' fill={value} opacity={0.5}></circle>
        </pattern>
      ))}
    </>
  );
};
