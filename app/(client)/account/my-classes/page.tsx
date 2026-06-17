'use client';

import { Suspense } from 'react';
import { ScrollReveal } from "@/hooks/use-scroll-reveal";
import MyClassesList from "@/features/classes/components/my-classes-list";
import { Icons } from '@/components/icons';

function MyClassesListFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground font-medium">Đang tải danh sách lớp học...</span>
    </div>
  );
}

export default function MyClassesPage() {
    return (
        <ScrollReveal variant='fade-up' delay={100} duration={650} threshold={0.05}>
            <Suspense fallback={<MyClassesListFallback />}>
                <MyClassesList />
            </Suspense>
        </ScrollReveal>
    );
}