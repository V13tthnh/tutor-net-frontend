'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { cn, getAvatarUrl } from '@/lib/utils';
import {
  IconArrowLeft,
  IconCalendarEvent,
  IconClock,
  IconMapPin,
  IconUser,
  IconPhone,
  IconMail,
  IconNotes,
  IconCoins,
  IconCheck,
  IconX,
  IconEyeOff,
  IconSchool,
  IconUsers,
  IconBook,
} from '@tabler/icons-react';
import { adminClassRequestDetailOptions } from '../../api/queries';
import { classApplicationsQueryOptions } from '@/features/classes/api/queries';
import { acceptApplication } from '@/features/classes/api/service';
import { ReviewDialog } from './review-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ClassApplicationResponse } from '@/features/classes/api/types';

interface ClassRequestDetailPageProps {
  classRequestId: number;
}

export function ClassRequestDetailPage({ classRequestId }: ClassRequestDetailPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Dialog & Review states
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);

  // Manual Match confirmation dialog
  const [confirmMatchOpen, setConfirmMatchOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<ClassApplicationResponse | null>(null);
  const [isMatching, setIsMatching] = useState(false);

  // Client-side moderation state (hidden application IDs)
  const [hiddenAppIds, setHiddenAppIds] = useState<number[]>([]);

  // Fetch Class Request Details
  const { data: request, isLoading: requestLoading, isError: requestError } = useQuery(
    adminClassRequestDetailOptions(classRequestId)
  );

  // Fetch Applications List
  const { data: appsData, isLoading: appsLoading } = useQuery(
    classApplicationsQueryOptions(classRequestId)
  );

  const applicants = appsData?.data || [];
  const visibleApplicants = applicants.filter((app) => !hiddenAppIds.includes(app.id));

  // Match Tutor Mutation
  const handleConfirmMatch = async () => {
    if (!selectedApplicant) return;
    setIsMatching(true);
    try {
      const res = await acceptApplication(classRequestId, selectedApplicant.id);
      toast.success(res.message || 'Đã chốt gia sư thành công!');
      setConfirmMatchOpen(false);
      setSelectedApplicant(null);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['admin-class-requests'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Có lỗi xảy ra khi chốt gia sư. Vui lòng thử lại.');
    } finally {
      setIsMatching(false);
    }
  };

  const handleHideApplication = (appId: number) => {
    setHiddenAppIds((prev) => [...prev, appId]);
    toast.success('Đã ẩn đơn ứng tuyển vi phạm chính sách.');
  };

  if (requestLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Icons.spinner className="h-10 w-10 animate-spin text-primary" />
        <span className="text-sm font-medium text-muted-foreground">Đang tải thông tin chi tiết yêu cầu lớp học...</span>
      </div>
    );
  }

  if (requestError || !request) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-2xl bg-card p-6">
        <div className="h-12 w-12 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
          <Icons.alertCircle size={24} />
        </div>
        <p className="text-foreground font-bold text-base">Lỗi tải dữ liệu yêu cầu lớp học</p>
        <p className="text-muted-foreground mt-1 text-sm max-w-sm">
          Yêu cầu không tồn tại hoặc đã bị xóa khỏi hệ thống.
        </p>
        <Button variant="outline" className="mt-4 h-9 text-xs" onClick={() => router.push('/admin/class-requests')}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  // Format currency
  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(request.proposedPrice);

  const teachingModeLabel = {
    ONLINE: 'Online (Trực tuyến)',
    OFFLINE: 'Tại nhà (Trực tiếp)',
    HYBRID: 'Kết hợp cả hai',
  }[request.teachingMode] || request.teachingMode;

  const statusLabel = {
    PENDING: 'Chờ duyệt',
    APPROVED: 'Đã duyệt (Đang tìm gia sư)',
    REJECTED: 'Từ chối',
    CANCELLED: 'Hủy',
  }[request.status] || request.status;

  const statusColor = {
    PENDING: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900',
    APPROVED: 'bg-green-500/10 text-green-600 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900',
    REJECTED: 'bg-red-500/10 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900',
    CANCELLED: 'bg-gray-500/10 text-gray-600 border-gray-200 dark:bg-gray-950/20 dark:text-gray-400 dark:border-gray-900',
  }[request.status] || 'bg-primary/10 text-primary border-primary/20';

  const isMatched = !!request.targetTutorId || applicants.some((app) => app.status === 'ACCEPTED');

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Button
        variant="ghost"
        onClick={() => router.push('/admin/class-requests')}
        className="gap-2 pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors"
      >
        <IconArrowLeft size={16} />
        Quay lại danh sách yêu cầu
      </Button>

      {/* Main Page Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Applicants */}
        <div className="lg:col-span-2 space-y-6">
          {/* Class Request Detail Card */}
          <Card className="shadow-sm">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant="outline" className={cn('font-bold border', statusColor)}>
                  {statusLabel}
                </Badge>
                <span className="text-xs font-mono text-muted-foreground">ID: #{request.id}</span>
                {isMatched && (
                  <Badge className="bg-emerald-500 text-white font-bold">
                    Đã chốt gia sư
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <IconBook className="text-primary h-5 w-5" />
                Môn học: {request.subjectName} – {request.gradeLevel}
              </CardTitle>
              <CardDescription>
                Tạo lúc: {new Date(request.createdAt).toLocaleString('vi-VN')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Pricing Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-primary/5 dark:bg-primary/10 p-4 rounded-xl border border-primary/10">
                <div className="space-y-1">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                    <IconCoins size={14} className="text-primary" />
                    Học phí đề xuất:
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-primary text-xl font-extrabold">{formattedPrice}</span>
                    <span className="text-muted-foreground text-xs">/ tháng</span>
                  </div>
                </div>
                <div className="space-y-1 sm:border-l sm:pl-4 border-primary/20">
                  <span className="text-xs text-muted-foreground font-semibold block mb-1">Hình thức dạy:</span>
                  <Badge variant="secondary" className="font-bold">
                    {teachingModeLabel}
                  </Badge>
                </div>
              </div>

              {/* Reject reason */}
              {request.rejectionReason && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 rounded-xl">
                  <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-1">Lý do từ chối:</p>
                  <p className="text-sm text-red-600 dark:text-red-300 font-serif leading-relaxed italic">&ldquo;{request.rejectionReason}&rdquo;</p>
                </div>
              )}

              {/* Detailed Grid Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-l-2 border-primary pl-2">
                  Thông tin lớp học
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border/60">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <IconCalendarEvent size={18} className="text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Số buổi học</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{request.sessionsPerWeek} buổi / tuần</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 min-w-0">
                    <IconClock size={18} className="text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Thời lượng học</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{request.durationMinutes} phút / buổi</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 min-w-0 sm:col-span-2 border-t pt-3 mt-1 border-border/40">
                    <IconMapPin size={18} className="text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Địa chỉ học tập</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{request.addressDetail || 'Học online'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Notes */}
              {request.studentNotes && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-l-2 border-primary pl-2">
                    Yêu cầu khác từ phụ huynh / học sinh
                  </h3>
                  <div className="flex items-start gap-3 bg-muted/10 p-4 rounded-xl border border-dashed leading-relaxed text-sm text-foreground/90 font-serif italic">
                    <IconNotes size={18} className="text-primary shrink-0 mt-0.5" />
                    <span>&ldquo;{request.studentNotes}&rdquo;</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Applied Tutors Section */}
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <IconUsers className="text-primary h-5 w-5" />
                Gia sư ứng tuyển ({visibleApplicants.length})
              </CardTitle>
              <CardDescription>
                Danh sách gia sư đã gửi hồ sơ ứng tuyển dạy lớp học này.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {appsLoading ? (
                <div className="flex items-center justify-center py-10 gap-2">
                  <Icons.spinner className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Đang tải danh sách ứng tuyển...</span>
                </div>
              ) : visibleApplicants.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl bg-muted/10">
                  <Icons.users className="mx-auto h-8 w-8 text-muted-foreground/40 mb-3" />
                  <p className="font-semibold text-sm">Chưa có gia sư nào ứng tuyển</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Hồ sơ ứng tuyển sẽ xuất hiện tại đây sau khi lớp học được duyệt công khai.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {visibleApplicants.map((app) => {
                    const avatarUrl = getAvatarUrl(app.tutorAvatarUrl);
                    const isAppPending = app.status === 'PENDING';
                    const isAppAccepted = app.status === 'ACCEPTED';
                    const isAppRejected = app.status === 'REJECTED';

                    // Conditions to allow manual matching:
                    // Class request must be approved, application pending, and no tutor matched yet
                    const canMatch = request.status === 'APPROVED' && isAppPending && !isMatched;

                    return (
                      <div
                        key={app.id}
                        className={cn(
                          'border rounded-xl p-4 bg-background shadow-sm flex flex-col md:flex-row gap-4 items-start justify-between transition-all relative overflow-hidden',
                          isAppAccepted && 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/10',
                          isAppRejected && 'opacity-60 bg-muted/20'
                        )}
                      >
                        {/* Tutor profile and credentials */}
                        <div className="flex gap-3 items-start flex-1 min-w-0">
                          <Avatar className="h-11 w-11 border border-border shrink-0">
                            {avatarUrl ? (
                              <AvatarImage src={avatarUrl} alt={app.tutorName} className="object-cover" />
                            ) : null}
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                              {app.tutorName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-sm text-foreground truncate">{app.tutorName}</h4>
                              
                              {/* Application Status Badge */}
                              {isAppAccepted && (
                                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider">
                                  Đã chốt dạy lớp
                                </Badge>
                              )}
                              {isAppRejected && (
                                <Badge variant="outline" className="text-rose-600 border-rose-200 text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider">
                                  Từ chối
                                </Badge>
                              )}
                              {isAppPending && (
                                <Badge variant="outline" className="text-amber-600 border-amber-200 text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider">
                                  Đang xem xét
                                </Badge>
                              )}
                            </div>

                            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                              <IconSchool size={13} className="text-muted-foreground/70" />
                              {app.university} {app.major ? `– ${app.major}` : ''}
                            </p>

                            {app.headline && (
                              <p className="text-xs text-foreground/80 font-medium font-sans italic leading-tight">
                                &ldquo;{app.headline}&rdquo;
                              </p>
                            )}

                            {app.message && (
                              <div className="bg-muted/40 border p-3 rounded-lg text-xs leading-relaxed text-foreground/90 font-serif italic mt-2">
                                <span className="font-bold font-sans text-[10px] text-muted-foreground uppercase block mb-1">Lời nhắn ứng tuyển:</span>
                                &ldquo;{app.message}&rdquo;
                              </div>
                            )}

                            <div className="text-[10px] text-muted-foreground pt-1">
                              Ứng tuyển ngày: {new Date(app.appliedAt).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        </div>

                        {/* Actions for this tutor */}
                        <div className="flex md:flex-col gap-2 shrink-0 w-full md:w-auto items-end pt-3 md:pt-0 border-t md:border-t-0 border-border/40 mt-1 md:mt-0">
                          {canMatch && (
                            <Button
                              size="sm"
                              className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer w-full md:w-auto shadow-sm"
                              onClick={() => {
                                setSelectedApplicant(app);
                                setConfirmMatchOpen(true);
                              }}
                            >
                              <IconCheck size={12} className="mr-1" />
                              Chốt gia sư
                            </Button>
                          )}
                          
                          {isAppPending && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs font-semibold cursor-pointer w-full md:w-auto text-muted-foreground border-border/80 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                              onClick={() => handleHideApplication(app.id)}
                            >
                              <IconEyeOff size={12} className="mr-1" />
                              Ẩn đơn
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Contact & Moderation */}
        <div className="space-y-6">
          {/* Contact Details Card */}
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5">
                <IconUser className="text-primary h-4 w-4" />
                Thông tin liên hệ
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-start gap-2.5">
                <IconUser size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">Tên khách hàng</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{request.contactName}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 border-t pt-3">
                <IconPhone size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">Số điện thoại</p>
                  <p className="text-sm font-mono font-semibold text-foreground mt-0.5">{request.contactPhone || 'Chưa cập nhật'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 border-t pt-3">
                <IconMail size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">Địa chỉ Email</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5 truncate max-w-[190px]">{request.contactEmail || 'Chưa cập nhật'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Moderation Card (Approval/Rejection Actions) */}
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Icons.shieldCheck className="text-primary h-4 w-4" />
                Kiểm duyệt yêu cầu
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-3">
              <div className="text-xs text-muted-foreground leading-relaxed">
                {request.status === 'PENDING' ? (
                  'Yêu cầu này đang ở trạng thái chờ duyệt. Vui lòng kiểm tra kỹ nội dung và thông tin liên hệ trước khi phê duyệt hiển thị công khai.'
                ) : (
                  <span>
                    Trạng thái hiện tại: <strong className="text-foreground">{statusLabel}</strong>. Yêu cầu đã được kiểm duyệt và xử lý.
                  </span>
                )}
              </div>

              {request.status === 'PENDING' && (
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer text-xs font-bold"
                    onClick={() => {
                      setReviewAction('approve');
                      setReviewOpen(true);
                    }}
                  >
                    <IconCheck size={14} />
                    Phê duyệt lớp học
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full gap-2 cursor-pointer text-xs font-bold"
                    onClick={() => {
                      setReviewAction('reject');
                      setReviewOpen(true);
                    }}
                  >
                    <IconX size={14} />
                    Từ chối yêu cầu
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review Class Request Dialog */}
      <ReviewDialog
        open={reviewOpen}
        request={request}
        action={reviewAction}
        onClose={() => {
          setReviewOpen(false);
          setReviewAction(null);
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-class-requests'] });
        }}
      />

      {/* Manual Matching Tutor Confirmation Dialog */}
      <Dialog open={confirmMatchOpen} onOpenChange={setConfirmMatchOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <IconCheck size={20} />
              Xác nhận chốt gia sư
            </DialogTitle>
            <DialogDescription>
              Hành động này sẽ thay mặt phụ huynh để chốt gia sư giảng dạy cho lớp học này.
            </DialogDescription>
          </DialogHeader>

          {selectedApplicant && (
            <div className="py-4 space-y-2">
              <p className="text-sm text-foreground">
                Bạn có chắc chắn muốn chốt gia sư <strong>{selectedApplicant.tutorName}</strong> cho lớp học <strong>{request.subjectName} – {request.gradeLevel}</strong> này không?
              </p>
              <div className="p-3 bg-muted rounded-lg border text-xs text-muted-foreground space-y-1">
                <div>• Gia sư: {selectedApplicant.tutorName} ({selectedApplicant.university})</div>
                <div>• Lớp học: ID #{request.id} – {request.subjectName}</div>
                <div>• Học phí: {formattedPrice} / tháng</div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmMatchOpen(false);
                setSelectedApplicant(null);
              }}
              disabled={isMatching}
            >
              Hủy bỏ
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 cursor-pointer"
              onClick={handleConfirmMatch}
              disabled={isMatching}
            >
              {isMatching ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận chốt'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
