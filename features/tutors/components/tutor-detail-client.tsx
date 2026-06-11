'use client';

import { useQuery } from '@tanstack/react-query';
import { tutorByIdOptions } from '../api/queries';
import { publicTutorReviewsQueryOptions } from '@/features/reviews/api/queries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { getAvatarUrl } from '@/lib/utils';
import {
  IconBadgeHd,
  IconMapPin,
  IconSchool,
  IconStar,
  IconVideo,
  IconHome,
  IconShieldCheck,
  IconMessageCircle,
  IconCalendar,
  IconBriefcase,
  IconArrowLeft,
  IconMoodSad,
  IconUser,
  IconCheck,
  IconUsers,
  IconBook
} from '@tabler/icons-react';
import Link from 'next/link';

interface TutorDetailClientProps {
  id: number;
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span className='flex items-center gap-0.5'>
      {Array.from({ length: 5 }).map((_, i) => (
        <IconStar
          key={i}
          size={16}
          className={
            i < full
              ? 'fill-amber-400 text-amber-400'
              : i === full && half
                ? 'fill-amber-200 text-amber-400'
                : 'fill-muted text-muted-foreground'
          }
        />
      ))}
    </span>
  );
}

function TeachingMethodBadge({ method }: { method: string }) {
  const icon =
    method === 'Dạy online' ? (
      <IconVideo size={16} />
    ) : method === 'Dạy tại nhà' ? (
      <IconHome size={16} />
    ) : (
      <IconBadgeHd size={16} />
    );
  const color =
    method === 'Dạy online'
      ? 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800 dark:text-blue-400'
      : method === 'Dạy tại nhà'
        ? 'bg-green-500/10 text-green-600 border-green-200 dark:border-green-800 dark:text-green-400'
        : 'bg-violet-500/10 text-violet-600 border-violet-200 dark:border-violet-800 dark:text-violet-400';

  return (
    <span className={`flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${color}`}>
      {icon}
      {method}
    </span>
  );
}

export function TutorDetailClient({ id }: TutorDetailClientProps) {
  const { data, isLoading, isError } = useQuery(tutorByIdOptions(id));
  const { data: reviews = [] } = useQuery(publicTutorReviewsQueryOptions(id));

  if (isLoading) {
    return (
      <div className='mx-auto max-w-5xl px-4 py-8'>
        <div className='mb-6'>
          <Skeleton className='h-10 w-24' />
        </div>
        <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
          <div className='md:col-span-2 space-y-6'>
            <Skeleton className='h-64 w-full rounded-xl' />
            <Skeleton className='h-40 w-full rounded-xl' />
          </div>
          <div>
            <Skeleton className='h-80 w-full rounded-xl' />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data || !data.success || !data.tutor) {
    return (
      <div className='flex flex-col items-center justify-center py-20 text-center'>
        <IconMoodSad size={64} className='text-muted-foreground mb-4' />
        <h1 className='text-foreground text-2xl font-bold'>Không tìm thấy gia sư</h1>
        <p className='text-muted-foreground mt-2'>Gia sư bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        <Link href='/tutors' className='mt-6'>
          <Button>Quay lại danh sách</Button>
        </Link>
      </div>
    );
  }

  const tutor = data.tutor;
  const fullName = `${tutor.first_name} ${tutor.last_name}`;
  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(tutor.price_per_session);

  return (
    <div className='mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8'>
      {/* Back navigation */}
      <div className='mb-6'>
        <Link href='/tutors' className='text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors'>
          <IconArrowLeft size={16} />
          Quay lại danh sách gia sư
        </Link>
      </div>

      <div className='grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12'>
        {/* Left Column (Main Content) */}
        <div className='md:col-span-2 space-y-8'>
          {/* Header Card */}
          <div className='bg-card flex flex-col gap-6 rounded-2xl border p-6 sm:flex-row sm:items-start'>
            <div className='relative mx-auto sm:mx-0 shrink-0'>
              <div className='bg-muted h-32 w-32 overflow-hidden rounded-2xl ring-4 ring-background'>
                <Image
                  src={getAvatarUrl(tutor.avatar_url) || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + tutor.id}
                  alt={fullName}
                  width={128}
                  height={128}
                  className='h-full w-full object-cover'
                  unoptimized
                />
              </div>
              {tutor.is_verified && (
                <div className='bg-background absolute -right-2 -bottom-2 rounded-full p-1'>
                  <div className='bg-emerald-100 flex items-center justify-center rounded-full p-1.5 dark:bg-emerald-900/30'>
                    <IconShieldCheck size={20} className='text-emerald-600 dark:text-emerald-400' />
                  </div>
                </div>
              )}
            </div>

            <div className='flex-1 text-center sm:text-left'>
              <div className='flex flex-wrap items-center justify-center gap-2 sm:justify-start'>
                <h1 className='text-foreground text-2xl font-bold sm:text-3xl'>{fullName}</h1>
                <Badge variant='outline' className='bg-background text-xs'>
                  {tutor.gender}
                </Badge>
                {tutor.is_featured && (
                  <Badge className='bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700'>
                    Nổi bật
                  </Badge>
                )}
              </div>

              <div className='mt-3 flex flex-wrap items-center justify-center gap-4 sm:justify-start'>
                <div className='flex items-center gap-1.5'>
                  <StarRating rating={tutor.rating} />
                  <span className='text-foreground font-semibold'>{tutor.rating.toFixed(1)}</span>
                  <span className='text-muted-foreground text-sm'>({tutor.total_reviews} đánh giá)</span>
                </div>
              </div>

              <div className='mt-4 flex flex-wrap items-center justify-center gap-4 text-sm sm:justify-start'>
                <div className='text-muted-foreground flex items-center gap-1.5'>
                  <IconMapPin size={16} />
                  {tutor.province}
                </div>
                <div className='text-muted-foreground flex items-center gap-1.5'>
                  <IconSchool size={16} />
                  {tutor.university}
                </div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <section>
            <h2 className='text-foreground mb-4 text-xl font-bold'>Giới thiệu về gia sư</h2>
            <div className='bg-card rounded-2xl border p-6'>
              <p className='text-muted-foreground whitespace-pre-wrap leading-relaxed'>{tutor.bio}</p>
            </div>
          </section>

          {/* Subjects & Levels */}
          <section>
            <h2 className='text-foreground mb-4 text-xl font-bold'>Chuyên môn giảng dạy</h2>
            <div className='grid gap-6 sm:grid-cols-2'>
              <Card>
                <CardContent className='p-6'>
                  <h3 className='text-foreground mb-4 flex items-center gap-2 font-semibold'>
                    <IconBook size={18} className='text-primary' /> Môn học
                  </h3>
                  <div className='flex flex-wrap gap-2'>
                    {tutor.subjects.map((subject) => (
                      <Badge key={subject} variant='secondary' className='px-3 py-1 text-sm'>
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-6'>
                  <h3 className='text-foreground mb-4 flex items-center gap-2 font-semibold'>
                    <IconUsers size={18} className='text-primary' /> Cấp độ
                  </h3>
                  <div className='flex flex-wrap gap-2'>
                    {tutor.levels.map((level) => (
                      <span key={level} className='bg-muted text-foreground rounded-md px-3 py-1 text-sm'>
                        {level}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Education & Experience */}
          <section>
            <h2 className='text-foreground mb-4 text-xl font-bold'>Học vấn & Kinh nghiệm</h2>
            <div className='bg-card space-y-6 rounded-2xl border p-6'>
              <div className='flex gap-4'>
                <div className='bg-primary/10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full'>
                  <IconSchool size={20} className='text-primary' />
                </div>
                <div>
                  <h3 className='text-foreground font-semibold'>Trường đào tạo</h3>
                  <p className='text-muted-foreground mt-1'>{tutor.university}</p>
                </div>
              </div>
              <Separator />
              <div className='flex gap-4'>
                <div className='bg-primary/10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full'>
                  <IconBriefcase size={20} className='text-primary' />
                </div>
                <div>
                  <h3 className='text-foreground font-semibold'>Kinh nghiệm giảng dạy</h3>
                  <p className='text-muted-foreground mt-1'>{tutor.experience_years} năm kinh nghiệm làm gia sư</p>
                </div>
              </div>
              <Separator />
              <div className='flex gap-4'>
                <div className='bg-primary/10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full'>
                  <IconUser size={20} className='text-primary' />
                </div>
                <div>
                  <h3 className='text-foreground font-semibold'>Thông tin thêm</h3>
                  <ul className='text-muted-foreground mt-1 space-y-2'>
                    <li className='flex items-center gap-2'>
                      <IconCheck size={16} className='text-emerald-500' /> {tutor.age} tuổi
                    </li>
                    <li className='flex items-center gap-2'>
                      <IconCheck size={16} className='text-emerald-500' /> Cập nhật hồ sơ: {new Date(tutor.updated_at).toLocaleDateString('vi-VN')}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Reviews Section */}
          <section className='mt-8'>
            <h2 className='text-foreground mb-4 text-xl font-bold'>Đánh giá từ phụ huynh ({reviews.length})</h2>
            <div className='space-y-4'>
              {reviews.length === 0 ? (
                <div className='bg-card flex flex-col items-center justify-center rounded-2xl border p-8 text-center'>
                  <IconStar size={32} className='text-muted-foreground/30 mb-2' />
                  <p className='text-muted-foreground text-sm font-medium'>Chưa có đánh giá nào</p>
                  <p className='text-muted-foreground/60 text-xs mt-1'>Học sinh hoặc phụ huynh chưa gửi đánh giá nào cho gia sư này.</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className='bg-card rounded-2xl border p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow'>
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex items-center gap-3'>
                        <div className='bg-muted h-10 w-10 overflow-hidden rounded-full flex items-center justify-center font-bold text-foreground text-sm border'>
                          {review.reviewer_avatar ? (
                            <img src={getAvatarUrl(review.reviewer_avatar) || review.reviewer_avatar} alt={review.reviewer_name} className="h-full w-full object-cover" />
                          ) : (
                            review.reviewer_name.charAt(0)
                          )}
                        </div>
                        <div>
                          <h4 className='text-foreground font-semibold text-sm'>{review.reviewer_name}</h4>
                          <span className='text-muted-foreground text-[10px]'>
                            {new Date(review.created_at).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                      <div className='flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0'>
                        <IconStar size={12} className='fill-amber-400 text-amber-400' />
                        {review.rating} / 5
                      </div>
                    </div>
                    <p className='text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap'>{review.comment}</p>
                    
                    {/* Tutor reply if any */}
                    {review.reply && (
                      <div className='bg-muted/40 border-l-2 border-primary/60 rounded-r-xl p-4 mt-3 ml-4 space-y-1.5'>
                        <div className='flex items-center justify-between text-xs'>
                          <span className='font-semibold text-foreground flex items-center gap-1'>
                            <IconSchool size={14} className='text-primary' />
                            Phản hồi từ Gia sư {fullName}
                          </span>
                          <span className='text-muted-foreground text-[10px]'>
                            {review.replied_at && new Date(review.replied_at).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <p className='text-muted-foreground text-xs leading-relaxed whitespace-pre-wrap'>{review.reply}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column (Sidebar) */}
        <div className='md:col-span-1'>
          <div className='sticky top-24'>
            <Card className='border-primary/20 shadow-lg'>
              <CardContent className='p-6'>
                <div className='mb-6'>
                  <p className='text-muted-foreground text-sm font-medium'>Học phí dự kiến</p>
                  <div className='mt-2 flex items-baseline gap-1'>
                    <span className='text-primary text-3xl font-bold'>{formattedPrice}</span>
                    <span className='text-muted-foreground text-sm'>/ buổi</span>
                  </div>
                </div>

                <div className='mb-6 space-y-4'>
                  <div>
                    <p className='text-muted-foreground mb-2 text-sm font-medium'>Hình thức dạy</p>
                    <TeachingMethodBadge method={tutor.teaching_method} />
                  </div>
                  <div>
                    <p className='text-muted-foreground mb-2 text-sm font-medium'>Khu vực</p>
                    <div className='text-foreground flex items-center gap-2 text-sm font-medium'>
                      <IconMapPin size={16} className='text-muted-foreground' />
                      {tutor.province}
                    </div>
                  </div>
                </div>

                <Button size='lg' className='w-full gap-2 text-base' onClick={() => alert('Chức năng liên hệ đang được phát triển!')}>
                  <IconMessageCircle size={20} />
                  Liên hệ gia sư
                </Button>
                <Button size='lg' variant='outline' className='mt-3 w-full gap-2 text-base' onClick={() => alert('Chức năng đặt lịch đang được phát triển!')}>
                  <IconCalendar size={20} />
                  Đặt lịch học thử
                </Button>

                <p className='text-muted-foreground mt-4 text-center text-xs'>
                  Bạn sẽ không bị tính phí cho đến khi lịch học thử được xác nhận.
                </p>
              </CardContent>
            </Card>

            {/* Trust Badges */}
            <div className='mt-6 space-y-3'>
              <div className='text-muted-foreground flex items-center gap-3 text-sm'>
                <IconShieldCheck size={20} className='text-emerald-500 shrink-0' />
                <span>Gia sư đã được xác minh danh tính và bằng cấp</span>
              </div>
              <div className='text-muted-foreground flex items-center gap-3 text-sm'>
                <IconStar size={20} className='text-amber-500 shrink-0' />
                <span>Hệ thống đánh giá công khai, minh bạch</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
