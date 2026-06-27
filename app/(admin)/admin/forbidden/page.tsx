'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className='flex flex-1 flex-col items-center justify-center px-4 py-16'>
      {/* Icon */}
      <div className='relative mb-6 flex h-20 w-20 items-center justify-center'>
        <div className='animate-ring-pulse absolute inset-0 rounded-full border border-destructive/40' />
        <svg
          className='animate-icon-shake h-12 w-12 text-destructive'
          viewBox='0 0 24 24'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            d='M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <path
            d='M4.93 4.93L19.07 19.07'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
          />
        </svg>
      </div>

      {/* Status code */}
      <div className='animate-code-in bg-gradient-to-br from-destructive via-orange-500 to-destructive/80 bg-clip-text text-[96px] font-black leading-none tracking-[-4px] text-transparent'>
        403
      </div>

      {/* Title */}
      <h1 className='animate-fade-up-1 mt-2 mb-4 text-xl font-bold tracking-[6px] text-foreground uppercase'>
        LỖI
      </h1>

      {/* Description */}
      <p className='animate-fade-up-2 max-w-sm text-center text-sm leading-relaxed text-muted-foreground'>
        Rất tiếc! Đã xảy ra lỗi. Vui lòng thử lại sau ít phút.
      </p>

      <Separator className='animate-fade-up-3 my-8 max-w-xs' />

      {/* Actions */}
      <div className='animate-fade-up-4 flex flex-wrap justify-center gap-3'>
        <Button
          onClick={() => router.push('/admin/dashboard')}
          variant='destructive'
          size='lg'
        >

          Về trang chủ
        </Button>

        <Button onClick={() => router.back()} variant='outline' size='lg'>
          Quay lại
        </Button>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes ringPulse {
          0%, 100% { transform: scale(1);    opacity: 0.6; }
          50%       { transform: scale(1.2); opacity: 0.15; }
        }
        @keyframes iconShake {
          10%, 90% { transform: rotate(-2deg); }
          20%, 80% { transform: rotate(3deg);  }
          30%, 50%, 70% { transform: rotate(-4deg); }
          40%, 60% { transform: rotate(4deg);  }
        }
        @keyframes codeIn {
          from { opacity: 0; transform: scale(0.8) translateY(10px); }
          to   { opacity: 1; transform: scale(1)   translateY(0);    }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0);    }
        }

        .animate-ring-pulse { animation: ringPulse 2.5s ease-in-out infinite; }
        .animate-icon-shake { animation: iconShake 0.5s cubic-bezier(0.36,0.07,0.19,0.97) 0.4s both; }
        .animate-code-in    { animation: codeIn    0.7s cubic-bezier(0.16,1,0.3,1) both; }
        .animate-fade-up-1  { animation: fadeUp    0.6s ease 0.15s both; }
        .animate-fade-up-2  { animation: fadeUp    0.6s ease 0.25s both; }
        .animate-fade-up-3  { animation: fadeUp    0.6s ease 0.35s both; }
        .animate-fade-up-4  { animation: fadeUp    0.6s ease 0.45s both; }
      `}</style>
    </div>
  );
}
