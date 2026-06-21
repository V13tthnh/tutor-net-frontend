'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PublicHeader } from '@/features/tutors/components/public-header';
import PublicFooter from '@/features/tutors/components/public-footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { ScrollReveal } from '@/hooks/use-scroll-reveal';

function PaymentResultContent() {
  const searchParams = useSearchParams();

  // Support both 'payment' and 'status' parameter names from redirect URL
  const paymentStatus = searchParams.get('payment') || searchParams.get('status');
  const contractCode = searchParams.get('contractCode') || searchParams.get('contractNumber') || '';

  const isSuccess = paymentStatus === 'success';

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4">
      <ScrollReveal variant="fade-up" duration={600} threshold={0.1}>
        <Card className="w-full max-w-md mx-auto overflow-hidden border bg-card shadow-xl rounded-2xl relative">
          {/* Subtle top decoration bar */}
          <div className={`h-2 w-full ${isSuccess ? 'bg-emerald-500' : 'bg-destructive'}`} />

          <CardContent className="pt-10 pb-8 px-6 text-center space-y-6">
            {/* Animated Icon Container */}
            <div className="flex justify-center">
              {isSuccess ? (
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-emerald-100 dark:bg-emerald-950/40 animate-ping opacity-75" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <Icons.circleCheck size={48} className="animate-bounce" />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-rose-100 dark:bg-rose-950/40 animate-ping opacity-75" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-900/20 text-destructive border border-rose-200 dark:border-rose-800">
                    <Icons.xCircle size={48} className="animate-pulse" />
                  </div>
                </div>
              )}
            </div>

            {/* Results Title & Description */}
            <div className="space-y-2">
              <h1 className={`text-2xl font-bold tracking-tight ${isSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán không thành công'}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed px-2">
                {isSuccess ? (
                  <>
                    Phí dịch vụ cho Hợp đồng{' '}
                    <span className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded border">
                      {contractCode || 'N/A'}
                    </span>{' '}
                    đã được hệ thống ghi nhận thành công. Cảm ơn bạn!
                  </>
                ) : (
                  <>
                    Giao dịch thanh toán không thành công hoặc đã bị người dùng hủy bỏ. Hợp đồng{' '}
                    <span className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded border">
                      {contractCode || 'N/A'}
                    </span>{' '}
                    chưa được hoàn tất thanh toán.
                  </>
                )}
              </p>
            </div>

            {/* Additional info box */}
            <div className="rounded-xl border bg-muted/40 p-4 text-left text-xs text-muted-foreground space-y-1.5">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Icons.info size={14} className="text-primary" />
                Thông tin giao dịch
              </div>
              <div className="grid grid-cols-3 gap-1 pt-1 border-t border-border/60">
                <span className="col-span-1">Hình thức:</span>
                <span className="col-span-2 text-foreground font-medium">Cổng VNPay</span>
                <span className="col-span-1">Dịch vụ:</span>
                <span className="col-span-2 text-foreground font-medium">Thanh toán phí nhận lớp</span>
                {contractCode && (
                  <>
                    <span className="col-span-1">Hợp đồng:</span>
                    <span className="col-span-2 text-foreground font-mono font-semibold">{contractCode}</span>
                  </>
                )}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex flex-col gap-2.5 pt-2">
              <Button asChild className="w-full h-10 font-semibold cursor-pointer">
                <Link href="/account/contracts">
                  <Icons.forms size={16} className="mr-2" />
                  Xem hợp đồng của tôi
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-10 font-semibold cursor-pointer">
                <Link href="/">
                  <Icons.home size={16} className="mr-2" />
                  Về trang chủ
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </ScrollReveal>
    </div>
  );
}

function PaymentResultFallback() {
  return (
    <div className="flex-1 flex items-center justify-center py-20">
      <Card className="w-full max-w-md mx-auto border bg-card shadow-lg rounded-2xl p-8 text-center space-y-4">
        <Icons.spinner className="h-10 w-10 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground font-medium">Đang xử lý kết quả thanh toán...</p>
      </Card>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <div className="min-h-screen bg-muted/20 flex flex-col justify-between">
      <PublicHeader />
      <Suspense fallback={<PaymentResultFallback />}>
        <PaymentResultContent />
      </Suspense>
      <PublicFooter />
    </div>
  );
}
