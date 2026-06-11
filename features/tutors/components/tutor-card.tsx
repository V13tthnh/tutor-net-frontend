'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Tutor } from '@/constants/mock-api-tutors';
import {
  IconBadgeHd,
  IconMapPin,
  IconSchool,
  IconVideo,
  IconHome,
  IconShieldCheck
} from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn, getAvatarUrl } from '@/lib/utils';

function TeachingMethodBadge({ method }: { method: string }) {
  const icon =
    method === 'Online (Trực tuyến)' ? (
      <IconVideo size={10} />
    ) : method === 'Offline (Tại nhà)' ? (
      <IconHome size={10} />
    ) : (
      <IconBadgeHd size={10} />
    );
  const color =
    method === 'Online (Trực tuyến)'
      ? 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800 dark:text-blue-400'
      : method === 'Offline (Tại nhà)'
        ? 'bg-green-500/10 text-green-600 border-green-200 dark:border-green-800 dark:text-green-400'
        : 'bg-violet-500/10 text-violet-600 border-violet-200 dark:border-violet-800 dark:text-violet-400';

  return (
    <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${color}`}>
      {icon}
      {method}
    </span>
  );
}

interface TutorCardProps {
  tutor: Tutor;
  layout?: 'grid' | 'list';
  onContactClick?: (tutor: Tutor) => void;
  onInviteClick?: (tutor: Tutor) => void;
}

export function TutorCard({ tutor, layout = 'grid', onContactClick, onInviteClick }: TutorCardProps) {
  const fullName = `${tutor.first_name} ${tutor.last_name}`;
  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(tutor.price_per_session);

  const isList = layout === 'list';

  return (
    <Card className={cn(
      'group relative flex overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
      isList ? 'flex-col sm:flex-row items-stretch' : 'flex-col h-full'
    )}>
      <Link href={`/tutors/${tutor.id}`} className='absolute inset-0 z-10' aria-label={`Xem chi tiết ${fullName}`} />

      {/* Featured badge */}
      {tutor.is_featured && (
        <div className='dark:from-primary dark:to-primary/80 from-primary to-primary/80 absolute top-0 right-0 z-10 rounded-bl-xl bg-gradient-to-r px-3 py-1 text-[10px] font-bold tracking-wider text-primary-foreground uppercase'>
          Nổi bật
        </div>
      )}

      <div className={cn('p-5 flex-1', isList && 'sm:pr-6')}>
        <div className={cn('flex', isList ? 'flex-col sm:flex-row gap-4 sm:gap-6' : 'flex-col')}>

          {/* Avatar Area */}
          <div className={cn('flex items-start gap-4', isList && 'sm:w-64 shrink-0')}>
            <div className='relative shrink-0 z-0'>
              <div className={cn(
                'bg-muted overflow-hidden rounded-full ring-2 ring-offset-2 ring-offset-white transition-all duration-300 group-hover:ring-primary dark:ring-offset-gray-900',
                isList ? 'h-20 w-20 sm:h-24 sm:w-24' : 'h-16 w-16'
              )}>
                <Image
                  src={getAvatarUrl(tutor.avatar_url) || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + tutor.id}
                  alt={fullName}
                  width={96}
                  height={96}
                  className='h-full w-full object-cover'
                  unoptimized
                />
              </div>
              {tutor.is_verified && (
                <span className='bg-background absolute -right-1 -bottom-1 rounded-full p-0.5 z-10'>
                  <IconShieldCheck size={isList ? 18 : 14} className='text-primary' />
                </span>
              )}
            </div>

            <div className='min-w-0 flex-1 z-0'>
              <h3
                className={cn('text-foreground font-semibold group-hover:text-primary transition-colors', isList ? 'text-lg' : 'text-base')}
              >
                {fullName}
              </h3>

              <div className='text-muted-foreground mt-1 flex items-center gap-1 text-xs'>
                Giới tính: <span className='font-medium text-foreground'>{tutor.gender}</span>
              </div>

              <div className='text-muted-foreground mt-1 flex items-center gap-1 text-xs'>
                <IconMapPin size={11} />
                <span className='truncate'>{tutor.province}</span>
              </div>


            </div>
          </div>

          {/* Details Area */}
          <div className='flex-1 z-0 relative mt-3 sm:mt-0'>
            <p className={cn('text-muted-foreground leading-relaxed', isList ? 'line-clamp-3 text-sm mt-1' : 'line-clamp-2 text-xs mt-2')}>{tutor.bio}</p>
            <div className={cn('flex flex-wrap gap-1', isList ? 'mt-4' : 'mt-3')}>
              {tutor.subjects.slice(0, isList ? 5 : 3).map((subject) => (
                <Badge key={subject} variant='secondary' className={cn('px-2 py-0.5', isList ? 'text-xs' : 'text-[11px]')}>
                  {subject}
                </Badge>
              ))}
              {tutor.subjects.length > (isList ? 5 : 3) && (
                <Badge variant='outline' className={cn('px-2 py-0.5', isList ? 'text-xs' : 'text-[11px]')}>
                  +{tutor.subjects.length - (isList ? 5 : 3)}
                </Badge>
              )}
            </div>

            <div className='mt-2 flex flex-wrap gap-1'>
              {tutor.levels.slice(0, isList ? 4 : 2).map((level) => (
                <span
                  key={level}
                  className={cn('bg-muted text-muted-foreground rounded-md px-2 py-0.5', isList ? 'text-xs' : 'text-[10px]')}
                >
                  {level}
                </span>
              ))}
              {tutor.levels.length > (isList ? 4 : 2) && (
                <span className={cn('bg-muted text-muted-foreground rounded-md px-2 py-0.5', isList ? 'text-xs' : 'text-[10px]')}>
                  +{tutor.levels.length - (isList ? 4 : 2)}
                </span>
              )}
            </div>

            <div className='mt-3 flex flex-col gap-1.5'>
              <div className='flex items-start gap-1.5'>
                <IconSchool size={13} className='text-muted-foreground mt-0.5 shrink-0' />
                <p className='text-muted-foreground line-clamp-1 text-xs'>{tutor.university}</p>
              </div>
              <div className='flex items-start mt-0.5'>
                <TeachingMethodBadge method={tutor.teaching_method} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={cn(
        'z-20 relative flex border-t shrink-0 gap-3 px-5 py-3.5',
        isList
          ? 'sm:w-48 sm:flex-col sm:border-t-0 sm:border-l p-5 justify-center sm:self-stretch'
          : 'mt-auto items-center justify-between'
      )}>
        <Button
          size='sm'
          variant='outline'
          className={cn('cursor-pointer', isList ? 'w-full h-10' : 'flex-1 h-9')}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onContactClick?.(tutor);
          }}
        >
          Xem CV
        </Button>
        <Button
          size='sm'
          className={cn('cursor-pointer', isList ? 'w-full h-10' : 'flex-1 h-9')}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onInviteClick?.(tutor);
          }}
        >
          Mời dạy
        </Button>
      </div>
    </Card>
  );
}
