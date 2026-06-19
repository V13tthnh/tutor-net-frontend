'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ContractDetails {
  id: number;
  contractNumber: string;
  classCode: string;
  subjectName: string;
  partnerName: string;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Rất không hài lòng',
  2: 'Không hài lòng',
  3: 'Bình thường',
  4: 'Hài lòng',
  5: 'Rất hài lòng'
};

function GuestReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const contractId = searchParams.get('contractId');
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'form' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [contract, setContract] = useState<ContractDetails | null>(null);

  // Form states
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!contractId || !token) {
      setStatus('error');
      setErrorMsg('Đường dẫn không hợp lệ. Vui lòng kiểm tra lại liên kết trong email.');
      return;
    }

    const fetchContractDetails = async () => {
      try {
        const res = await fetch(`/api/v1/reviews/guest-contract?contractId=${contractId}&token=${token}`);
        if (!res.ok) {
          let msg = 'Không thể tải thông tin lớp học.';
          try {
            const data = await res.json();
            if (data.message) msg = data.message;
          } catch {}
          throw new Error(msg);
        }

        const json = await res.json();
        if (json.success && json.data) {
          setContract(json.data);
          setStatus('form');
        } else {
          throw new Error(json.message || 'Hợp đồng không tồn tại hoặc đã được đánh giá.');
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message || 'Đã có lỗi xảy ra khi xác thực thông tin hợp đồng.');
      }
    };

    fetchContractDetails();
  }, [contractId, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractId || !token) return;

    if (comment.trim().length < 10) {
      toast.warning('Nhận xét cần tối thiểu 10 ký tự.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        contractId: parseInt(contractId),
        rating,
        comment: comment.trim(),
        guestReviewToken: token
      };

      const res = await fetch('/api/v1/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let msg = 'Gửi đánh giá thất bại.';
        try {
          const data = await res.json();
          if (data.message) msg = data.message;
        } catch {}
        throw new Error(msg);
      }

      setStatus('success');
      toast.success('Gửi đánh giá thành công! Cảm ơn bạn đã đóng góp ý kiến.');
    } catch (err: any) {
      toast.error(err.message || 'Đã xảy ra lỗi trong quá trình gửi đánh giá.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Loading Skeleton Screen
  if (status === 'loading') {
    return (
      <div className='w-full max-w-lg p-8 rounded-3xl bg-card border shadow-xl space-y-6 animate-pulse'>
        <div className='flex justify-center'>
          <div className='h-12 w-12 rounded-full bg-muted' />
        </div>
        <div className='space-y-3 text-center'>
          <div className='h-6 bg-muted rounded-md w-3/4 mx-auto' />
          <div className='h-4 bg-muted rounded-md w-1/2 mx-auto' />
        </div>
        <div className='space-y-4 pt-4 border-t border-muted'>
          <div className='h-24 bg-muted rounded-2xl w-full' />
          <div className='h-10 bg-muted rounded-md w-1/3 mx-auto' />
        </div>
      </div>
    );
  }

  // 2. Error Screen
  if (status === 'error') {
    return (
      <div className='w-full max-w-lg p-8 rounded-3xl bg-card border shadow-2xl text-center space-y-6 transition-all duration-300'>
        <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40 text-red-500 shadow-md'>
          <Icons.warning size={32} />
        </div>
        <div className='space-y-2'>
          <h2 className='text-2xl font-bold text-foreground tracking-tight'>Đường dẫn không hợp lệ</h2>
          <p className='text-sm text-muted-foreground bg-red-50/50 dark:bg-red-950/20 p-4 rounded-2xl border border-red-100 dark:border-red-950/50 leading-relaxed font-medium text-left'>
            {errorMsg}
          </p>
        </div>
        <div className='pt-2'>
          <Button
            onClick={() => router.push('/')}
            className='w-full h-12 font-semibold text-sm transition-transform active:scale-95'
          >
            Quay lại Trang chủ
          </Button>
        </div>
      </div>
    );
  }

  // 3. Success Screen
  if (status === 'success') {
    return (
      <div className='w-full max-w-lg p-8 rounded-3xl bg-card border shadow-2xl text-center space-y-6 transition-all duration-300'>
        <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500 shadow-md animate-bounce'>
          <Icons.circleCheck size={32} />
        </div>
        <div className='space-y-2'>
          <h2 className='text-2xl font-bold text-foreground tracking-tight'>Gửi Đánh Giá Thành Công!</h2>
          <p className='text-sm text-muted-foreground px-4 leading-relaxed font-light'>
            Cảm ơn phản hồi quý báu từ bạn. Đánh giá này sẽ giúp hệ thống cải thiện chất lượng gia sư tốt hơn.
          </p>
        </div>
        <div className='pt-4 border-t border-muted space-y-3'>
          {contract && (
            <div className='bg-muted/40 p-4 rounded-2xl text-left space-y-1.5 text-xs'>
              <p className='text-muted-foreground font-medium'>
                Lớp học: <span className='text-foreground font-semibold'>{contract.subjectName}</span>
              </p>
              <p className='text-muted-foreground font-medium'>
                Mã lớp: <span className='text-foreground font-semibold'>#{contract.classCode}</span>
              </p>
              <p className='text-muted-foreground font-medium'>
                Gia sư: <span className='text-foreground font-semibold'>{contract.partnerName}</span>
              </p>
            </div>
          )}
          <Button
            onClick={() => router.push('/')}
            className='w-full h-12 font-semibold text-sm transition-transform active:scale-95'
          >
            Về Trang chủ
          </Button>
        </div>
      </div>
    );
  }

  // 4. Form Screen
  return (
    <div className='w-full max-w-lg p-8 rounded-3xl bg-card border shadow-2xl space-y-6 transition-all duration-300'>
      <div className='text-center space-y-2'>
        <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm'>
          <Icons.pro size={24} />
        </div>
        <h1 className='text-2xl font-bold tracking-tight text-foreground'>Đánh Giá Chất Lượng Gia Sư</h1>
        <p className='text-sm text-muted-foreground'>
          Dành 1 phút để đánh giá sau khi lớp học hoàn thành
        </p>
      </div>

      {contract && (
        <div className='p-4 rounded-2xl bg-muted/40 border text-sm space-y-2'>
          <div className='flex justify-between items-center border-b pb-2 border-muted'>
            <span className='text-xs font-semibold text-primary uppercase tracking-wide'>Thông tin lớp học</span>
            <span className='text-xs text-muted-foreground font-medium'>#{contract.classCode}</span>
          </div>
          <div className='grid grid-cols-2 gap-y-1.5 text-xs pt-1'>
            <span className='text-muted-foreground'>Môn học:</span>
            <span className='font-semibold text-foreground text-right'>{contract.subjectName}</span>
            <span className='text-muted-foreground'>Gia sư giảng dạy:</span>
            <span className='font-semibold text-foreground text-right'>{contract.partnerName}</span>
            <span className='text-muted-foreground'>Mã hợp đồng:</span>
            <span className='font-mono text-muted-foreground text-right'>{contract.contractNumber}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Star Rating Section */}
        <div className='space-y-2.5 text-center'>
          <Label className='text-sm font-semibold text-foreground'>
            Bạn chấm điểm chất lượng giảng dạy bao nhiêu sao?
          </Label>
          <div className='flex flex-col items-center gap-1.5'>
            <div className='flex items-center justify-center gap-2 py-2'>
              {Array.from({ length: 5 }).map((_, index) => {
                const value = index + 1;
                const active = value <= (hoverRating || rating);

                return (
                  <button
                    key={value}
                    type='button'
                    className='rounded-xl p-1.5 transition-transform duration-200 hover:scale-125 focus:outline-none focus:ring-2 focus:ring-primary/20'
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHoverRating(value)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    <Icons.pro
                      className={cn(
                        'h-9 w-9 transition-colors duration-200',
                        active
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'fill-muted text-muted-foreground/20'
                      )}
                    />
                  </button>
                );
              })}
            </div>
            <p className='text-sm font-bold text-amber-500 animate-pulse duration-700 min-h-5'>
              {RATING_LABELS[hoverRating || rating]}
            </p>
          </div>
        </div>

        {/* Comment Section */}
        <div className='space-y-2'>
          <div className='flex justify-between items-baseline'>
            <Label htmlFor='comment' className='text-sm font-semibold text-foreground'>
              Nhận xét công khai
            </Label>
            <span className='text-[10px] text-muted-foreground font-light'>
              Tối thiểu 10 ký tự
            </span>
          </div>
          <Textarea
            id='comment'
            required
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder='Hãy chia sẻ cảm nhận về sự tiến bộ của học sinh, phương pháp giảng dạy, mức độ đúng giờ hoặc thái độ giảng dạy của gia sư...'
            className='min-h-[120px] rounded-2xl resize-none border focus-visible:ring-primary/20 focus-visible:border-primary transition-all p-4'
          />
          <div className='flex justify-between text-[11px] text-muted-foreground px-1'>
            <span>Nhập phản hồi khách quan</span>
            <span className={cn(comment.trim().length >= 10 ? 'text-green-500 font-medium' : 'text-amber-500')}>
              {comment.trim().length} ký tự
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <div className='pt-2'>
          <Button
            type='submit'
            disabled={isSubmitting || comment.trim().length < 10}
            className='w-full h-12 rounded-2xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-primary/20 active:scale-[0.98]'
          >
            {isSubmitting ? (
              <>
                <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                Đang gửi đánh giá...
              </>
            ) : (
              'Gửi Đánh Giá Ngay'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function GuestReviewPage() {
  return (
    <div className='relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-primary/5 dark:from-gray-950 dark:via-gray-900 dark:to-primary/10 px-4 py-12'>
      {/* Background blobs for premium feel */}
      <div className='pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl' />
      <div className='pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl' />

      <Suspense
        fallback={
          <div className='w-full max-w-lg p-8 rounded-3xl bg-card border shadow-xl space-y-6 animate-pulse'>
            <div className='flex justify-center'>
              <div className='h-12 w-12 rounded-full bg-muted' />
            </div>
            <div className='space-y-3 text-center'>
              <div className='h-6 bg-muted rounded-md w-3/4 mx-auto' />
              <div className='h-4 bg-muted rounded-md w-1/2 mx-auto' />
            </div>
            <div className='space-y-4 pt-4 border-t border-muted'>
              <div className='h-24 bg-muted rounded-2xl w-full' />
              <div className='h-10 bg-muted rounded-md w-1/3 mx-auto' />
            </div>
          </div>
        }
      >
        <GuestReviewContent />
      </Suspense>
    </div>
  );
}
