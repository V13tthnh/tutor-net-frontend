'use client';

import { Suspense } from 'react';
import { ScrollReveal } from "@/hooks/use-scroll-reveal";
import MyContractsList from "@/features/contracts/components/my-contracts-list";
import { Icons } from '@/components/icons';

function MyContractsListFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 bg-card rounded-2xl border">
      <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground font-medium">Đang tải danh sách hợp đồng...</span>
    </div>
  );
}

export default function MyContractsPage() {
    return (
        <ScrollReveal variant='fade-up' delay={100} duration={650} threshold={0.05}>
            <Suspense fallback={<MyContractsListFallback />}>
                <MyContractsList />
            </Suspense>
        </ScrollReveal>
    );
}
