import PageContainer from '@/components/layout/page-container';
import React from 'react';

export default async function OverViewLayout({
  children,
  sales,
  pie_stats
}: {
  children: React.ReactNode;
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
}) {

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        {children}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4 md:col-span-3'>
            {sales}
          </div>
          <div className='col-span-4 md:col-span-4'>{pie_stats}</div>
        </div>
      </div>
    </PageContainer>
  );
}
