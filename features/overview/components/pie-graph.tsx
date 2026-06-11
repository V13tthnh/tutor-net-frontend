'use client';

import { LabelList, Pie, PieChart } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

const chartData = [
  { subject: 'math', classes: 850, fill: 'var(--color-math)' },
  { subject: 'english', classes: 620, fill: 'var(--color-english)' },
  { subject: 'physics', classes: 410, fill: 'var(--color-physics)' },
  { subject: 'chemistry', classes: 380, fill: 'var(--color-chemistry)' },
  { subject: 'other', classes: 240, fill: 'var(--color-other)' }
];

const chartConfig = {
  classes: {
    label: 'Số lớp'
  },
  math: {
    label: 'Toán',
    color: 'var(--chart-1)'
  },
  english: {
    label: 'Tiếng Anh',
    color: 'var(--chart-2)'
  },
  physics: {
    label: 'Vật Lý',
    color: 'var(--chart-3)'
  },
  chemistry: {
    label: 'Hóa Học',
    color: 'var(--chart-4)'
  },
  other: {
    label: 'Khác',
    color: 'var(--chart-5)'
  }
} satisfies ChartConfig;

export function PieGraph() {
  return (
    <Card className='flex h-full flex-col'>
      <CardHeader className='items-center pb-0'>
        <CardTitle>Môn học phổ biến</CardTitle>
        <CardDescription>Phân bổ số lượng lớp theo môn học</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 items-center justify-center pb-0'>
        <ChartContainer
          config={chartConfig}
          className='[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[300px] min-h-[250px]'
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey='classes' hideLabel />} />
            <Pie
              data={chartData}
              innerRadius={30}
              dataKey='classes'
              radius={10}
              cornerRadius={8}
              paddingAngle={4}
            >
              <LabelList
                dataKey='classes'
                stroke='none'
                fontSize={12}
                fontWeight={500}
                fill='currentColor'
                formatter={(value: number) => value.toString()}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
