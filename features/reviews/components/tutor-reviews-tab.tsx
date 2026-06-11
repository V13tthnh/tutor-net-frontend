'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tutorReviewsQueryOptions } from '../api/queries';
import { replyToReviewMutation } from '../api/mutations';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';

export function TutorReviewsTab() {
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuthSession();
  const userId = user?.id || 0;
  const isLoaded = !authLoading;
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});

  // Fetch reviews received by this tutor
  const { data: reviews = [], isLoading } = useQuery(
    tutorReviewsQueryOptions(isLoaded ? userId : 0)
  );

  // Reply mutation
  const replyMutation = useMutation({
    ...replyToReviewMutation,
    onSuccess: () => {
      toast.success('Phản hồi đánh giá thành công!');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Lỗi khi gửi phản hồi.');
    }
  });

  if (!isLoaded || isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleReplyChange = (reviewId: number, text: string) => {
    setReplyTexts((prev) => ({ ...prev, [reviewId]: text }));
  };

  const handleReplySubmit = (reviewId: number) => {
    const text = replyTexts[reviewId];
    if (!text || text.trim().length === 0) {
      toast.warning('Nội dung phản hồi không được để trống.');
      return;
    }

    replyMutation.mutate({
      id: reviewId,
      reply: text
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Icons.pro
            key={i}
            className={`h-4 w-4 ${i < rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground/20'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-xl">Quản lý nhận xét của phụ huynh</CardTitle>
        <CardDescription>
          Đây là nơi bạn theo dõi phản hồi và gửi trả lời (reply) chính thức cho phụ huynh. Đánh giá công khai sẽ xuất hiện trên trang cá nhân của bạn.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icons.chat className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <h3 className="text-sm font-semibold">Chưa có đánh giá nào</h3>
            <p className="text-xs text-muted-foreground mt-1">Hiện tại phụ huynh chưa gửi đánh giá nào cho các buổi học với bạn.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div 
                key={review.id} 
                className={`border rounded-xl p-5 space-y-4 bg-background/50 hover:border-primary/20 transition-all ${
                  !review.is_public ? 'border-dashed border-destructive/40 bg-destructive/5' : ''
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs text-primary">
                      {review.reviewer_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{review.reviewer_name}</span>
                        {!review.is_public && (
                          <span className="text-[10px] bg-destructive/10 text-destructive border border-destructive/20 rounded px-1.5 py-0.5 font-bold">
                            Bị ẩn do từ nhạy cảm
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString('vi-VN')} lúc {new Date(review.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  {renderStars(review.rating)}
                </div>

                {/* Comment */}
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap pl-1">
                  {review.comment}
                </p>

                {/* Private report section indicator for developer reference */}
                {review.is_reported && (
                  <div className="border border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400 p-2.5 rounded-lg text-xs font-semibold pl-3">
                    ⚠️ Phụ huynh đã báo cáo vi phạm nội bộ. Báo cáo này chỉ gửi cho Admin.
                  </div>
                )}

                {/* Reply section */}
                {review.reply ? (
                  <div className="bg-muted/40 border-l-2 border-primary/50 rounded-r-lg p-3.5 mt-2 ml-4 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
                      <span className="flex items-center gap-1">
                        <Icons.school className="h-3.5 w-3.5 text-primary" />
                        Phản hồi của bạn:
                      </span>
                      <span className="text-muted-foreground font-normal">
                        {review.replied_at && new Date(review.replied_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {review.reply}
                    </p>
                  </div>
                ) : (
                  <div className="pl-4 border-l-2 border-muted space-y-3 mt-2 ml-4 animate-in fade-in duration-200">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                      <Icons.edit className="h-3 w-3" />
                      Viết phản hồi cho phụ huynh:
                    </div>
                    <div className="flex items-end gap-3">
                      <Textarea
                        placeholder="Cảm ơn phản hồi từ anh/chị..."
                        className="min-h-[50px] text-xs bg-background/30 border-muted"
                        value={replyTexts[review.id] ?? ''}
                        onChange={(e) => handleReplyChange(review.id, e.target.value)}
                      />
                      <Button
                        size="sm"
                        className="bg-primary text-primary-foreground font-semibold px-4 h-8 shrink-0 text-xs rounded-md shadow"
                        onClick={() => handleReplySubmit(review.id)}
                        isLoading={replyMutation.isPending && replyMutation.variables?.id === review.id}
                      >
                        Gửi trả lời
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
