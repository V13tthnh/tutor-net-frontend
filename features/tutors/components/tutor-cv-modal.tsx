'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Tutor } from '@/constants/mock-api-tutors';
import type { AdminTutorDetail } from '@/features/admin/api/types';
import { IconShieldCheck, IconX } from '@tabler/icons-react';
import Image from 'next/image';
import { getAvatarUrl } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { useMemo, useState, useEffect } from 'react';
import { getClientSecurityFlags } from '@/features/security-sandbox/components/interceptor';

interface TutorCvModalProps {
  tutor: Tutor | null;
  tutorDetail?: AdminTutorDetail | null;
  open: boolean;
  onClose: () => void;
  isLoading?: boolean;
  onInviteClick?: (tutor: Tutor) => void;
}

/* ── Constants ── */
const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const SESSIONS = ['Sáng', 'Chiều', 'Tối'];

const EDU_LEVEL_MAP: Record<string, string> = {
  'HIGH_SCHOOL': 'Tốt nghiệp THPT',
  'ASSOCIATE': 'Cao đẳng',
  'BACHELOR': 'Cử nhân',
  'UNIVERSITY': 'Đại học',
  'MASTER': 'Thạc sĩ',
  'PHD': 'Tiến sĩ',
  'OTHER': 'Khác',
};

const TEACHING_MODE_MAP: Record<string, string> = {
  'ONLINE': 'Trực tuyến (Online)',
  'OFFLINE': 'Tại nhà (Offline)',
  'HYBRID': 'Cả hai (Online & Offline)',
};

/* ── Helpers ── */
function getSessionIdx(startTime: string): number {
  const hour = parseInt(startTime.split(':')[0], 10);
  if (hour >= 7 && hour < 12) return 0; // Sáng
  if (hour >= 12 && hour < 17) return 1; // Chiều
  if (hour >= 17 && hour < 22) return 2; // Tối
  return -1;
}

/* ── Deterministic schedule from tutor id (fallback) ── */
function getSchedule(tutorId: number): boolean[][] {
  return SESSIONS.map((_, sIdx) =>
    DAYS.map((_, dIdx) => {
      const seed = (tutorId * 7 + dIdx * 3 + sIdx * 11) % 17;
      return seed % 3 !== 0;
    })
  );
}

/* ── Certificate placeholder images (fallback) ── */
function getCertImages(tutorId: number): string[] {
  return [tutorId * 3, tutorId * 3 + 1, tutorId * 3 + 2].map(
    (s) => `https://picsum.photos/seed/cert-${s}/220/155`
  );
}

function getAccent(province: string): string {
  if (!province) return 'Miền Bắc';
  if (['Hà Nội', 'Hải Phòng', 'Bắc Giang', 'Bắc Ninh'].some(p => province.includes(p))) return 'Miền Bắc';
  if (['Đà Nẵng', 'Huế', 'Quảng Nam'].some(p => province.includes(p))) return 'Miền Trung';
  return 'Miền Nam';
}

function getMajor(subject: string): string {
  const map: Record<string, string> = {
    Toán: 'Toán học',
    'Vật Lý': 'Vật lý',
    'Hóa Học': 'Hóa học',
    'Sinh Học': 'Sinh học',
    'Ngữ Văn': 'Ngữ văn',
    'Tiếng Anh': 'Ngôn ngữ Anh',
    'Lịch Sử': 'Lịch sử',
    'Địa Lý': 'Địa lý',
    'Tin Học': 'Công nghệ thông tin',
    GDCD: 'Giáo dục công dân',
  };
  return map[subject] ?? 'Sư phạm';
}

/* ═══════════════════════════════════════════════════════════ */
export function TutorCvModal({
  tutor,
  tutorDetail,
  open,
  onClose,
  isLoading,
  onInviteClick
}: TutorCvModalProps) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [targetWebsite, setTargetWebsite] = useState('google.com');
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState('');
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const handlePingWebsite = async () => {
    setPinging(true);
    setPingResult('');
    try {
      const res = await fetch(`/api/v1/upload/ping-website?host=${encodeURIComponent(targetWebsite)}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setPingResult(`Lệnh chạy: ${data.command}\n\n${data.output}`);
      } else {
        setPingResult(`Lỗi: ${data.error || 'Kiểm tra thất bại'}`);
      }
    } catch (e) {
      setPingResult('Lỗi kết nối tới server.');
    } finally {
      setPinging(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    const flags = getClientSecurityFlags();
    setShowDiagnostics(flags.includes('os_command'));
  }, [open]);

  // Reset preview source when the modal is opened, closed, or when tutor changes
  useEffect(() => {
    setPreviewSrc(null);
  }, [open, tutor, tutorDetail]);

  const hasDetail = !!tutorDetail && 'fullName' in tutorDetail;
  const activeTutor = hasDetail ? tutorDetail : tutor;

  // Availability schedule parsing
  const schedule = useMemo(() => {
    if (hasDetail && tutorDetail && Array.isArray(tutorDetail.availability)) {
      const grid = SESSIONS.map(() => DAYS.map(() => false));
      tutorDetail.availability.forEach((slot) => {
        const dIdx = slot.dayOfWeek === 0 ? 6 : slot.dayOfWeek - 1;
        const sIdx = getSessionIdx(slot.startTime);
        if (dIdx >= 0 && dIdx < 7 && sIdx >= 0 && sIdx < 3) {
          grid[sIdx][dIdx] = true;
        }
      });
      return grid;
    }
    return tutor ? getSchedule(tutor.id) : SESSIONS.map(() => DAYS.map(() => false));
  }, [tutorDetail, tutor, hasDetail]);

  const handleCertClick = (e: React.MouseEvent, fileUrl: string) => {
    const filename = fileUrl.split('/').pop() || '';
    const downloadUrl = `/api/v1/upload/files/download?filename=${encodeURIComponent(filename)}`;

    const isImg = fileUrl && /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(fileUrl);
    if (isImg) {
      e.preventDefault();
      setPreviewSrc(downloadUrl);
    } else {
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (!open) return null;

  // Render loading state
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className='flex h-[40vh] w-[95vw] max-w-md flex-col items-center justify-center rounded-xl border bg-white p-6 shadow-2xl dark:bg-gray-950'>
          <DialogTitle className='sr-only'>Đang tải thông tin gia sư</DialogTitle>
          <Icons.spinner className='animate-spin h-8 w-8 text-primary' />
          <p className='text-sm text-muted-foreground mt-4'>Đang tải thông tin gia sư...</p>
        </DialogContent>
      </Dialog>
    );
  }

  if (!activeTutor) return null;

  // Extract common fields
  const fullName = hasDetail ? tutorDetail.fullName : `${tutor?.first_name} ${tutor?.last_name}`;
  const avatar = hasDetail
    ? (tutorDetail.avatarUrl ? getAvatarUrl(tutorDetail.avatarUrl) : null)
    : (tutor ? getAvatarUrl(tutor.avatar_url) : null);
  const fallbackAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (hasDetail ? tutorDetail.id : tutor?.id);

  const isStudent = hasDetail
    ? (tutorDetail.occupation === 'Sinh viên')
    : (tutor ? tutor.age <= 26 : true);
  const university = hasDetail ? tutorDetail.university : (tutor?.university || 'Đại học');
  const level = hasDetail ? EDU_LEVEL_MAP[tutorDetail.educationLevel] || tutorDetail.educationLevel : 'Đại học';
  const age = hasDetail
    ? (tutorDetail.graduationYear ? (24 - (2027 - tutorDetail.graduationYear)) : 24)
    : (tutor?.age || 24);
  const genderMap: Record<string, string> = {
    'MALE': 'Nam',
    'FEMALE': 'Nữ',
    'OTHER': 'Khác'
  };
  const gender = hasDetail
    ? (genderMap[(tutorDetail as any).gender] || (tutorDetail as any).gender || 'Khác')
    : (tutor?.gender || 'Nam');
  const experienceYears = hasDetail ? tutorDetail.experienceYears : (tutor?.experience_years || 1);
  const province = hasDetail ? tutorDetail.province : (tutor?.province || 'Hà Nội');
  const provincesDetail = (tutor as any)?.provincesDetail;
  const provincesStr = provincesDetail && provincesDetail.length > 0
    ? provincesDetail.join(', ')
    : province;
  const subjectsDetail = (tutor as any)?.subjectsDetail;
  const graduation = hasDetail ? tutorDetail.graduationYear : (tutor ? new Date(tutor.created_at).getFullYear() + 2 : null);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className='flex !h-[90vh] !w-[95vw] !max-w-5xl flex-col overflow-hidden rounded-lg border bg-background p-0 gap-0 shadow-2xl'
        hideCloseButton
        onPointerDownOutside={(e) => {
          if (previewSrc) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          if (previewSrc) {
            e.preventDefault();
          }
        }}
      >
        <DialogTitle className='sr-only'>Hồ sơ gia sư {fullName}</DialogTitle>

        {/* ══ HEADER ══ */}
        <header className='flex shrink-0 items-center justify-between px-6 py-3.5 border-b'>
          <span className='font-bold tracking-widest uppercase'>
            Hồ Sơ Gia Sư {hasDetail && tutorDetail.status === 'APPROVED' && ' (Đã duyệt)'}
          </span>
          <button
            onClick={onClose}
            aria-label='Đóng'
            className='rounded-full p-1.5 transition-colors hover:bg-muted'
          >
            <IconX size={18} />
          </button>
        </header>

        {/* ══ BODY — takes all remaining height ══ */}
        <div className='flex min-h-0 flex-1 overflow-hidden'>

          {/* ── LEFT sidebar ── */}
          <aside
            className='
              w-72 shrink-0 overflow-y-auto
              border-r border-gray-200 bg-white p-5
              dark:border-gray-800 dark:bg-gray-950
              cv-scroll
            '
          >
            {/* Avatar */}
            <div className='flex flex-col items-center gap-3 pb-4'>
              <div className='relative'>
                <div
                  className='h-24 w-24 overflow-hidden rounded-full ring-2 ring-primary/20 ring-offset-2 ring-offset-white cursor-pointer hover:opacity-95 transition-opacity'
                  onClick={() => setPreviewSrc(avatar || fallbackAvatar)}
                >
                  <Image
                    src={avatar || fallbackAvatar}
                    alt={fullName}
                    width={96}
                    height={96}
                    className='h-full w-full object-cover'
                    unoptimized
                  />
                </div>
                {/* verified badge */}
                {((hasDetail && tutorDetail.status === 'APPROVED') || (!hasDetail && tutor?.is_verified)) && (
                  <span className='absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 dark:bg-gray-950 shadow-sm'>
                    <IconShieldCheck size={18} className='text-primary' />
                  </span>
                )}
                {/* available status dot */}
                {(!hasDetail || tutorDetail.isAvailable) && (
                  <span className='absolute top-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500 dark:border-gray-950' />
                )}
              </div>

              <div className='text-center'>
                <p className='text-base font-bold text-gray-800 dark:text-gray-100'>
                  {fullName}
                </p>
                {hasDetail && tutorDetail.occupation && (
                  <p className='text-xs text-muted-foreground mt-0.5 font-medium'>
                    {tutorDetail.occupation}
                  </p>
                )}
              </div>
            </div>

            <Divider />

            {/* Thông tin cá nhân */}
            <SideSection title='Thông tin cá nhân'>
              <InfoRow label='Gia sư là' value={isStudent ? 'Sinh viên' : 'Giáo viên/Người đi làm'} />
              <InfoRow label='Giới tính' value={gender} />
              <InfoRow label='Năm tốt nghiệp' value={String(graduation || 'Chưa cập nhật')} />
              <InfoRow label='Quê quán' value={province} />
              <InfoRow label='Giọng nói' value={getAccent(province)} />
            </SideSection>

            <Divider />

            {/* Học vấn */}
            <SideSection title='Học vấn'>
              <InfoRow label='Cấp bậc' value={level} />
              {isStudent && hasDetail && tutorDetail.studentYear && (
                <InfoRow label='Sinh viên năm' value={String(tutorDetail.studentYear)} />
              )}
              <InfoRow label='Chuyên ngành' value={hasDetail ? (tutorDetail.major || 'Chưa cập nhật') : getMajor(tutor?.subjects[0] ?? 'Toán')} />
              <InfoRow label='Trường' value={university} />
            </SideSection>

            {hasDetail && (
              <>
                <Divider />
                {/* Địa chỉ liên hệ */}
                <SideSection title='Địa chỉ hiện tại'>
                  <p className='text-[12px] leading-snug text-foreground font-medium'>
                    {tutorDetail.address}, {tutorDetail.ward}, {tutorDetail.province}
                  </p>
                </SideSection>
                <Divider />
                <SideSection title='Quê quán thường trú'>
                  <p className='text-[12px] leading-snug text-foreground font-medium'>
                    {tutorDetail.hometownProvince || '—'}
                  </p>
                </SideSection>
              </>
            )}
          </aside>

          {/* ── RIGHT main content ── */}
          <main
            className='
              cv-scroll min-w-0 flex-1 overflow-y-auto
              bg-white px-8 py-6
              dark:bg-gray-950
            '
          >
            {/* Chuyên môn dạy */}
            <ContentSection title='Chuyên môn & Học phí giảng dạy'>
              {hasDetail ? (
                <div className='space-y-2.5 max-w-xl'>
                  {tutorDetail.subjects && tutorDetail.subjects.length > 0 ? (
                    tutorDetail.subjects.map((sub) => (
                      <div key={sub.id} className='flex items-center justify-between text-sm border-b pb-1.5 last:border-0 last:pb-0'>
                        <div className='flex items-center gap-2'>
                          <span className='font-semibold text-gray-800 dark:text-gray-100'>- {sub.subjectName}</span>
                          <span className='text-[10px] bg-secondary text-secondary-foreground font-medium px-2 py-0.5 rounded-full uppercase tracking-wider'>
                            {sub.proficiencyLevel === 'BEGINNER' ? 'Cơ bản' : sub.proficiencyLevel === 'INTERMEDIATE' ? 'Trung cấp' : sub.proficiencyLevel === 'ADVANCED' ? 'Nâng cao' : 'Chuyên gia'}
                          </span>
                        </div>
                        <span className='font-bold text-primary'>
                          {sub.hourlyRate?.toLocaleString('vi-VN')} đ/giờ
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className='text-sm text-muted-foreground italic'>Chưa đăng ký môn dạy nào.</p>
                  )}
                </div>
              ) : subjectsDetail && subjectsDetail.length > 0 ? (
                <div className='space-y-2.5 max-w-xl'>
                  {subjectsDetail.map((sub: any) => (
                    <div key={sub.id} className='flex items-center justify-between text-sm border-b pb-1.5 last:border-0 last:pb-0'>
                      <span className='font-semibold text-gray-800 dark:text-gray-100'>- {sub.name}</span>
                      <span className='font-bold text-primary'>
                        {sub.hourlyRate?.toLocaleString('vi-VN')} đ/giờ
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                tutor?.subjects.map((subject) => (
                  <p key={subject} className='text-sm text-gray-700 dark:text-gray-300'>
                    -{' '}
                    <span className='font-semibold text-gray-800 dark:text-gray-100'>
                      {subject}
                    </span>
                    {tutor.levels && tutor.levels.length > 0 && (
                      <>
                        : {tutor.levels.map((l) => `${subject} ${l}`).join(', ')}
                      </>
                    )}
                  </p>
                ))
              )}
            </ContentSection>

            {/* Hình thức dạy */}
            <ContentSection title='Hình thức dạy'>
              <p className='text-sm text-gray-700 dark:text-gray-300'>
                - Hình thức:{' '}
                <span className='font-medium text-primary dark:text-gray-200'>
                  {hasDetail ? (
                    tutorDetail.teachingMode
                      ? (TEACHING_MODE_MAP[tutorDetail.teachingMode] || tutorDetail.teachingMode)
                      : (tutorDetail.teachingModes?.map(m => TEACHING_MODE_MAP[m] || m).join(', ') || 'Chưa cập nhật')
                  ) : tutor?.teaching_method}
                </span>
              </p>
              <p className='text-sm text-gray-700 dark:text-gray-300'>
                - Khu vực:{' '}
                <span className='font-medium text-primary dark:text-gray-200'>
                  {provincesStr}
                </span>
              </p>
            </ContentSection>

            {/* Thành tích và kinh nghiệm */}
            <ContentSection title='Thành tích và kinh nghiệm'>
              {hasDetail && tutorDetail.headline && (
                <p className='text-sm font-semibold italic text-primary mb-2'>
                  "{tutorDetail.headline}"
                </p>
              )}
              <p className='text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line'>
                {hasDetail ? tutorDetail.bio : tutor?.bio}
              </p>
              {hasDetail && tutorDetail.achievements && (
                <div className='mt-3 bg-muted/40 p-3.5 rounded-lg border border-dashed text-sm'>
                  <span className='block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1'>Thành tích nổi bật</span>
                  <span className='text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed'>{tutorDetail.achievements}</span>
                </div>
              )}
              <p className='mt-2.5 text-sm leading-relaxed text-gray-700 dark:text-gray-300'>
                Kinh nghiệm:{' '}
                <span className='font-semibold text-gray-800 dark:text-gray-200'>
                  {experienceYears} năm giảng dạy
                </span>
              </p>
            </ContentSection>

            {/* Thời gian có thể dạy */}
            <ContentSection title='Thời gian có thể dạy (Màu xanh)'>
              <div className='overflow-x-auto'>
                <table className='w-full table-fixed min-w-[520px] border-separate border-spacing-1.5 text-center text-xs'>
                  <thead>
                    <tr>
                      {DAYS.map((d) => (
                        <th
                          key={d}
                          className='pb-2 font-semibold text-gray-600 dark:text-gray-400'
                        >
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SESSIONS.map((session, sIdx) => (
                      <tr key={session}>
                        {DAYS.map((_, dIdx) => {
                          const active = schedule[sIdx]?.[dIdx];
                          return (
                            <td key={dIdx}>
                              <span
                                className={`block w-full rounded-md py-2 font-semibold tracking-wide transition-colors ${active
                                  ? 'bg-green-400 text-white shadow-sm'
                                  : 'border border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-600'
                                  }`}
                              >
                                {session}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ContentSection>

            {/* Student ID Card Verification */}
            {hasDetail && tutorDetail.idCardFrontUrl && (
              <ContentSection title='Minh chứng thẻ sinh viên'>
                <div className='max-w-md'>
                  <div
                    className='relative rounded-xl overflow-hidden border w-full h-48 bg-muted/10 group cursor-pointer'
                    onClick={() => setPreviewSrc(getAvatarUrl(tutorDetail.idCardFrontUrl) || '')}
                  >
                    <Image
                      src={getAvatarUrl(tutorDetail.idCardFrontUrl) || ''}
                      alt='Thẻ sinh viên'
                      fill
                      className='object-contain p-1 transition-transform group-hover:scale-105'
                      unoptimized
                    />
                  </div>
                </div>
              </ContentSection>
            )}

            {/* Chứng chỉ */}
            <ContentSection title='Bằng cấp & Chứng chỉ đính kèm'>
              {hasDetail ? (
                tutorDetail.certificates && tutorDetail.certificates.length > 0 ? (
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl'>
                    {tutorDetail.certificates.map((cert) => (
                      <div key={cert.id} className='rounded-lg border p-3.5 bg-muted/15 flex flex-col justify-between h-28'>
                        <div>
                          <div className='text-sm font-semibold flex items-center gap-1.5 text-gray-800 dark:text-gray-200'>
                            {cert.name}
                            {cert.isVerified && (
                              <IconShieldCheck size={14} className='text-primary shrink-0' />
                            )}
                          </div>
                          <div className='text-xs text-muted-foreground mt-0.5'>
                            Trạng thái: {cert.isVerified ? 'Đã xác thực' : 'Chờ kiểm duyệt'}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleCertClick(e, cert.fileUrl)}
                          className='text-xs text-primary hover:underline font-semibold inline-flex items-center gap-1 mt-2 w-fit text-left cursor-pointer'
                        >
                          Xem tài liệu đính kèm {cert.fileUrl && /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(cert.fileUrl) ? null : <Icons.externalLink size={12} />}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='text-sm text-muted-foreground italic'>Không có bằng cấp / chứng chỉ nào được đăng ký.</p>
                )
              ) : (
                <div className='flex flex-wrap gap-4'>
                  {getCertImages(tutor!.id).map((src, i) => (
                    <div
                      key={i}
                      className='overflow-hidden rounded-xl border border-gray-200 shadow-md transition-transform hover:scale-105 dark:border-gray-700 cursor-pointer'
                      onClick={() => setPreviewSrc(src)}
                    >
                      <Image
                        src={src}
                        alt={`Hình ảnh ${i + 1}`}
                        width={210}
                        height={155}
                        className='object-cover'
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              )}
            </ContentSection>

            {/* Website Diagnostics (OS Command Injection Demo) */}
            {showDiagnostics && (
              <ContentSection title='Chẩn đoán Website cá nhân của Gia sư (Admin Diagnostics)'>
                <div className='bg-muted/10 rounded-xl p-4 border border-dashed space-y-3 max-w-xl text-left'>
                  <p className='text-xs text-muted-foreground'>
                    Tính năng chẩn đoán máy chủ: Kiểm tra kết nối mạng tới Website/Portfolio cá nhân của gia sư bằng lệnh Ping.
                  </p>
                  <div className='flex gap-2 max-w-md'>
                    <Input
                      value={targetWebsite}
                      onChange={(e) => {
                        setTargetWebsite(e.target.value);
                        setPingResult('');
                      }}
                      placeholder="google.com; id"
                      className="font-mono text-xs bg-background h-8"
                    />
                    <Button
                      onClick={handlePingWebsite}
                      disabled={pinging}
                      size="sm"
                      className="h-8 text-xs shrink-0"
                    >
                      {pinging ? 'Đang ping...' : 'Ping kết nối'}
                    </Button>
                  </div>
                  {pingResult && (
                    <div className="space-y-1.5 animate-in fade-in duration-200">
                      <p className="text-[10px] font-semibold text-orange-400">Kết quả kiểm tra kết nối:</p>
                      <pre className="text-[11px] font-mono bg-black/85 p-3 rounded-lg text-green-400 whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {pingResult}
                      </pre>
                    </div>
                  )}
                </div>
              </ContentSection>
            )}
          </main>
        </div>

        {onInviteClick && (
          <footer className='flex shrink-0 items-center justify-end gap-3 px-6 py-4 border-t bg-muted/20 z-20'>
            <Button
              variant='outline'
              onClick={onClose}
              className="cursor-pointer font-medium px-6"
            >
              Xem thêm
            </Button>
            <Button
              onClick={() => {
                if (tutor) {
                  onInviteClick(tutor);
                }
              }}
              className="cursor-pointer font-medium px-6"
            >
              Mời dạy
            </Button>
          </footer>
        )}
      </DialogContent>

      {/* Lightbox / Image Preview Modal */}
      <Dialog open={mounted && !!previewSrc} onOpenChange={(v) => !v && setPreviewSrc(null)}>
        <DialogContent
          className="fixed inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !w-screen !h-screen !max-w-none !max-h-none border-none bg-black/80 backdrop-blur-sm shadow-none p-0 flex items-center justify-center z-[9999] [&>button]:hidden animate-in fade-in duration-200"
          hideCloseButton
        >
          <DialogTitle className="sr-only">Xem ảnh</DialogTitle>
          <div className="relative flex items-center justify-center w-full h-full" onClick={() => setPreviewSrc(null)}>
            <button
              type="button"
              className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/40 hover:bg-black/60 rounded-full p-2.5 transition-all duration-150 shadow-lg z-[10000]"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewSrc(null);
              }}
            >
              <IconX size={20} />
            </button>
            <div
              className="overflow-hidden rounded-xl bg-background shadow-2xl p-1 animate-in zoom-in-95 duration-200 max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {previewSrc && (
                <img src={previewSrc} alt="Preview" className="max-w-[85vw] max-h-[85vh] object-contain rounded-lg" />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

/* Sub-components                                              */

function Divider() {
  return <hr className='my-4 border-gray-100 dark:border-gray-800' />;
}

function SideSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className='mb-1'>
      <p className='mb-2 text-[11px] font-bold uppercase tracking-widest text-primary'>
        {title}
      </p>
      <div className='space-y-1.5'>{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <p className='text-[12px] text-gray-500 dark:text-gray-400'>
      - {label}:{' '}
      <span className='font-semibold text-foreground'>{value}</span>
    </p>
  );
}

function ContentSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className='mb-7'>
      <p className='mb-2.5 text-sm font-bold text-primary'>{title}</p>
      <div className='space-y-1.5'>{children}</div>
    </section>
  );
}
