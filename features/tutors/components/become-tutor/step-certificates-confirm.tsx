'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { IconUpload, IconPlus, IconTrash, IconBook, IconLoader2, IconSend, IconUser, IconX } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/utils';
import { getClientSecurityFlags } from '@/features/security-sandbox/components/interceptor';
import { toast } from 'sonner';

export interface CertificateInput {
  id: string;
  name: string;
  file: File | null;
  previewUrl?: string;
}

export interface Step4Data {
  avatarImage: File | null;
  avatarUrl: string;
  studentCardImage: File | null;
  studentCardUrl: string;
  certificates: CertificateInput[];
  agreed: boolean;
}

interface StepCertificatesConfirmProps {
  initialData: Step4Data;
  onChange: (data: Step4Data) => void;
  onValidityChange: (isValid: boolean) => void;
  isReadOnly: boolean;
  loading: boolean;
  onSubmit: () => void;
  profileStatus?: string;
}

export function StepCertificatesConfirm({
  initialData,
  onChange,
  onValidityChange,
  isReadOnly,
  loading,
  onSubmit,
  profileStatus = 'DRAFT'
}: StepCertificatesConfirmProps) {
  const [data, setData] = useState<Step4Data>(initialData);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [studentCardPreview, setStudentCardPreview] = useState<string>('');

  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [studentCardError, setStudentCardError] = useState<string | null>(null);
  const [certErrors, setCertErrors] = useState<Record<string, string>>({});

  // Hàm validate tệp tin ở Client
  const validateClientFile = useCallback((file: File, isAvatarOrCard: boolean): string | null => {
    const flags = getClientSecurityFlags();
    const isSandboxActive = flags.includes('upload_webshell') || flags.includes('ext_bypass') || flags.includes('mime_spoofing');

    if (isSandboxActive) return null; // Cho qua ở chế độ demo sandbox

    const filename = file.name.toLowerCase();

    // A. Chặn Double Extension (đuôi kép)
    const dotCount = (filename.match(/\./g) || []).length;
    if (dotCount > 1) {
      return `Tên tệp tin chứa nhiều đuôi mở rộng (Double Extension): "${file.name}"`;
    }

    // B. Chặn đuôi nguy hại (whitelist)
    const allowed = isAvatarOrCard
      ? ['.jpg', '.jpeg', '.png', '.webp', '.gif']
      : ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf'];

    const hasAllowedExt = allowed.some(ext => filename.endsWith(ext));
    if (!hasAllowedExt) {
      return `Định dạng file không hợp lệ. Chỉ chấp nhận các đuôi: ${allowed.join(', ')}`;
    }

    return null;
  }, []);

  // Validate fields
  const isValid = useMemo(() => {
    const hasAvatar = !!data.avatarImage || !!data.avatarUrl;
    if (!hasAvatar) return false;
    if (!data.agreed) return false;

    const hasValidCert = data.certificates.some(c => c.name.trim() !== '' && (c.file !== null || !!c.previewUrl));
    if (!hasValidCert) return false;

    return true;
  }, [data]);



  // Bubble state changes up to parent
  useEffect(() => {
    onChange(data);
  }, [data, onChange]);

  // Report validity to parent
  useEffect(() => {
    onValidityChange(isValid);
  }, [isValid, onValidityChange]);

  // Previews for Avatar
  useEffect(() => {
    if (data.avatarImage) {
      const url = URL.createObjectURL(data.avatarImage);
      setAvatarPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setAvatarPreview(getAvatarUrl(data.avatarUrl) || '');
    }
  }, [data.avatarImage, data.avatarUrl]);

  // Previews for Student Card
  useEffect(() => {
    if (data.studentCardImage) {
      const url = URL.createObjectURL(data.studentCardImage);
      setStudentCardPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setStudentCardPreview(getAvatarUrl(data.studentCardUrl) || '');
    }
  }, [data.studentCardImage, data.studentCardUrl]);

  // Clean up dynamic certificates preview URLs on unmount
  useEffect(() => {
    return () => {
      data.certificates.forEach(c => {
        if (c.previewUrl && c.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(c.previewUrl);
        }
      });
    };
  }, []);

  // Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'avatarImage' | 'studentCardImage') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const errorMsg = validateClientFile(file, true);

      if (field === 'avatarImage') {
        setAvatarError(errorMsg);
      } else {
        setStudentCardError(errorMsg);
      }

      if (errorMsg) {
        e.target.value = ''; // Reset file input
        setData(prev => ({
          ...prev,
          [field]: null
        }));
        return;
      }

      setData(prev => ({
        ...prev,
        [field]: file
      }));
    }
  };

  const handleRemoveAvatar = useCallback(() => {
    setAvatarError(null);
    setData(prev => ({
      ...prev,
      avatarImage: null,
      avatarUrl: ''
    }));
  }, []);

  const handleRemoveStudentCard = useCallback(() => {
    setStudentCardError(null);
    setData(prev => ({
      ...prev,
      studentCardImage: null,
      studentCardUrl: ''
    }));
  }, []);

  const handleAddCertificate = useCallback(() => {
    setData(prev => ({
      ...prev,
      certificates: [...prev.certificates, { id: String(Date.now()), name: '', file: null }]
    }));
  }, []);

  const handleRemoveCertificate = useCallback((id: string) => {
    setCertErrors(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });

    setData(prev => {
      const target = prev.certificates.find(c => c.id === id);
      if (target?.previewUrl && target.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }

      const updated = prev.certificates.filter(c => c.id !== id);
      return {
        ...prev,
        certificates: updated.length === 0 ? [{ id: '1', name: '', file: null }] : updated
      };
    });
  }, []);

  const handleUpdateCertificateName = useCallback((id: string, name: string) => {
    setData(prev => ({
      ...prev,
      certificates: prev.certificates.map(c => c.id === id ? { ...c, name } : c)
    }));
  }, []);

  const handleCertificateFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const errorMsg = validateClientFile(file, false);

      setCertErrors(prev => ({
        ...prev,
        [id]: errorMsg || ''
      }));

      if (errorMsg) {
        e.target.value = ''; // Reset file input
        setData(prev => ({
          ...prev,
          certificates: prev.certificates.map(c => {
            if (c.id === id) {
              if (c.previewUrl && c.previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(c.previewUrl);
              }
              return {
                ...c,
                file: null,
                previewUrl: undefined
              };
            }
            return c;
          })
        }));
        return;
      }

      setData(prev => ({
        ...prev,
        certificates: prev.certificates.map(c => {
          if (c.id === id) {
            if (c.previewUrl && c.previewUrl.startsWith('blob:')) {
              URL.revokeObjectURL(c.previewUrl);
            }
            return {
              ...c,
              file,
              previewUrl: URL.createObjectURL(file)
            };
          }
          return c;
        })
      }));
    }
  }, [validateClientFile]);

  const handleUpdateCertificateFileUrl = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      certificates: prev.certificates.map(c => {
        if (c.id === id) {
          if (c.previewUrl && c.previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(c.previewUrl);
          }
          return {
            ...c,
            file: null,
            previewUrl: undefined
          };
        }
        return c;
      })
    }));
  }, []);

  return (
    <div className='space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300'>
      {/* Ảnh đại diện & Thẻ sinh viên */}
      <div className='rounded-2xl border bg-card shadow-sm p-6 space-y-4'>
        <div>
          <h2 className='font-bold text-lg text-foreground flex items-center gap-2'><IconUpload size={18} className='text-primary' />Ảnh đại diện & Thẻ sinh viên</h2>
        </div>

        <div className='grid gap-4 sm:grid-cols-2'>
          {/* Ảnh chân dung (Bắt buộc) */}
          <div className='space-y-1.5'>
            <Label className='text-xs font-semibold text-muted-foreground flex items-center gap-1'>
              Ảnh đại diện chân dung <span className='text-red-500'>*</span>
            </Label>
            <p className='text-[10px] text-muted-foreground -mt-1'>Ảnh thẻ hoặc ảnh tự chụp rõ mặt của bạn để hiển thị trên hồ sơ gia sư.</p>
            <div className='relative'>
              {!isReadOnly && <Input type='file' id='avatarImage' accept='image/*,.php,.php5,.txt' className='hidden' onChange={(e) => handleFileChange(e, 'avatarImage')} />}
              {avatarPreview ? (
                isReadOnly ? (
                  <div
                    className='relative rounded-xl border border-input overflow-hidden h-36 bg-muted/10 shadow-inner transition-all duration-200 cursor-pointer hover:opacity-90'
                    onClick={() => setPreviewSrc(avatarPreview)}
                  >
                    <img src={avatarPreview} alt="Ảnh đại diện" className='w-full h-full object-cover' />
                  </div>
                ) : (
                  <div className='relative rounded-xl border border-input overflow-hidden h-36 bg-muted/10 group shadow-inner transition-all duration-200'>
                    <img src={avatarPreview} alt="Ảnh đại diện" className='w-full h-full object-cover' />
                    <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all duration-200'>
                      <Button type='button' variant='secondary' size='sm' className='h-7 text-[10px] px-2.5 font-bold shadow bg-background hover:bg-muted text-foreground border' onClick={() => setPreviewSrc(avatarPreview)}>
                        Xem
                      </Button>
                      <Label htmlFor='avatarImage' className='px-2.5 py-1.5 bg-background text-foreground text-[10px] font-bold rounded-lg cursor-pointer shadow hover:bg-muted transition-all duration-150 border'>
                        Thay đổi
                      </Label>
                      <Button type='button' variant='destructive' size='sm' className='h-7 text-[10px] px-2.5 font-bold shadow' onClick={handleRemoveAvatar}>
                        Xóa
                      </Button>
                    </div>
                  </div>
                )
              ) : (
                <Label htmlFor='avatarImage' className='flex flex-col items-center justify-center rounded-xl border-2 border-dashed h-36 cursor-pointer transition-all duration-200 bg-muted/5 hover:border-primary hover:bg-primary/5 hover:text-primary'>
                  <IconUser size={22} className='text-muted-foreground mb-1' />
                  <span className='text-xs font-semibold'>Chọn ảnh đại diện</span>
                  <span className='text-[9px] text-muted-foreground mt-0.5'>Chấp nhận ảnh JPG, PNG dưới 2MB</span>
                </Label>
              )}
            </div>
            {avatarError && <p className="text-[10px] font-semibold text-red-500 mt-1">{avatarError}</p>}
          </div>

          {/* Ảnh thẻ sinh viên (Không bắt buộc) */}
          <div className='space-y-1.5'>
            <Label className='text-xs font-semibold text-muted-foreground'>Ảnh thẻ sinh viên (Nếu có)</Label>
            <p className='text-[10px] text-muted-foreground -mt-1'>Giúp nâng cao uy tín và tăng tỷ lệ được duyệt hồ sơ khi nhận lớp.</p>
            <div className='relative'>
              {!isReadOnly && <Input type='file' id='studentCardImage' accept='image/*,.php,.php5,.txt' className='hidden' onChange={(e) => handleFileChange(e, 'studentCardImage')} />}
              {studentCardPreview ? (
                isReadOnly ? (
                  <div
                    className='relative rounded-xl border border-input overflow-hidden h-36 bg-muted/10 shadow-inner transition-all duration-200 cursor-pointer hover:opacity-90'
                    onClick={() => setPreviewSrc(studentCardPreview)}
                  >
                    <img src={studentCardPreview} alt="Thẻ sinh viên" className='w-full h-full object-cover' />
                  </div>
                ) : (
                  <div className='relative rounded-xl border border-input overflow-hidden h-36 bg-muted/10 group shadow-inner transition-all duration-200'>
                    <img src={studentCardPreview} alt="Thẻ sinh viên" className='w-full h-full object-cover' />
                    <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all duration-200'>
                      <Button type='button' variant='secondary' size='sm' className='h-7 text-[10px] px-2.5 font-bold shadow bg-background hover:bg-muted text-foreground border' onClick={() => setPreviewSrc(studentCardPreview)}>
                        Xem
                      </Button>
                      <Label htmlFor='studentCardImage' className='px-2.5 py-1.5 bg-background text-foreground text-[10px] font-bold rounded-lg cursor-pointer shadow hover:bg-muted transition-all duration-150 border'>
                        Thay đổi
                      </Label>
                      <Button type='button' variant='destructive' size='sm' className='h-7 text-[10px] px-2.5 font-bold shadow' onClick={handleRemoveStudentCard}>
                        Xóa
                      </Button>
                    </div>
                  </div>
                )
              ) : (
                <Label htmlFor='studentCardImage' className='flex flex-col items-center justify-center rounded-xl border-2 border-dashed h-36 cursor-pointer transition-all duration-200 bg-muted/5 hover:border-primary hover:bg-primary/5 hover:text-primary'>
                  <IconUpload size={22} className='text-muted-foreground mb-1' />
                  <span className='text-xs font-semibold'>Chọn ảnh thẻ sinh viên</span>
                  <span className='text-[9px] text-muted-foreground mt-0.5'>Chấp nhận ảnh JPG, PNG dưới 5MB</span>
                </Label>
              )}
            </div>
            {studentCardError && <p className="text-[10px] font-semibold text-red-500 mt-1">{studentCardError}</p>}
          </div>
        </div>
      </div>

      {/* Danh sách chứng chỉ động */}
      <div className='rounded-2xl border bg-card shadow-sm p-6 space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='font-bold text-lg text-foreground flex items-center gap-2'><IconBook size={18} className='text-primary' />Bằng cấp & Chứng chỉ học thuật</h2>
            <p className='text-xs text-muted-foreground mt-0.5'>Cung cấp ảnh minh chứng cho bằng đại học, chứng chỉ ngoại ngữ (IELTS, HSK...) tương ứng môn đăng ký dạy.</p>
          </div>
          {/* Cho phép thêm chứng chỉ mới trừ khi ở trạng thái PENDING_REVIEW hoặc SUSPENDED */}
          {profileStatus !== 'PENDING_REVIEW' && profileStatus !== 'SUSPENDED' && (
            <Button type='button' variant='outline' size='sm' className='gap-1 h-8 text-xs font-semibold' onClick={handleAddCertificate}>
              <IconPlus size={14} /> Thêm chứng chỉ
            </Button>
          )}
        </div>

        <div className='space-y-4'>
          {data.certificates.map((cert, index) => (
            <div key={cert.id} className='relative p-4 rounded-xl border bg-muted/10 space-y-3 hover:shadow-sm transition-all duration-200 animate-in fade-in duration-200'>
              <div className='flex items-center justify-between'>
                <Label className='text-xs font-semibold text-primary'>Chứng chỉ #{index + 1}</Label>
                {profileStatus !== 'PENDING_REVIEW' && profileStatus !== 'SUSPENDED' && data.certificates.length > 1 && (
                  // Kiểm tra xem có phải chứng chỉ cũ đã được duyệt không:
                  // - Nếu có previewUrl nhưng không có file mới = chứng chỉ cũ
                  // - Nếu status là APPROVED = hồ sơ đã được duyệt
                  // => Ẩn nút xóa (không được xóa chứng chỉ cũ)
                  !(!!cert.previewUrl && !cert.file && profileStatus === 'APPROVED') && (
                    <Button type='button' variant='ghost' size='icon' className='h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/5'
                      onClick={() => handleRemoveCertificate(cert.id)}>
                      <IconTrash size={14} />
                    </Button>
                  )
                )}
              </div>

              <div className='grid gap-3 sm:grid-cols-2'>
                {/* Tên chứng chỉ */}
                <div className='space-y-1'>
                  <Label className='text-[11px] text-muted-foreground'>Tên chứng chỉ / Bằng cấp <span className='text-red-500'>*</span></Label>
                  <Input
                    placeholder='Ví dụ: IELTS Academic 8.0, Bằng cử nhân Sư phạm...'
                    className='h-9 text-xs bg-background'
                    value={cert.name}
                    onChange={(e) => handleUpdateCertificateName(cert.id, e.target.value)}
                    disabled={profileStatus === 'PENDING_REVIEW' || profileStatus === 'SUSPENDED' || (!!cert.previewUrl && !cert.file && profileStatus === 'APPROVED')}
                    title={((cert.previewUrl && !cert.file) && profileStatus === 'APPROVED') ? 'Không thể sửa chứng chỉ đã được duyệt' : ''}
                  />
                </div>

                {/* File upload & Preview */}
                <div className='space-y-1'>
                  <Label className='text-[11px] text-muted-foreground'>Tải ảnh / PDF minh chứng <span className='text-red-500'>*</span></Label>
                  <div className='relative'>
                    {profileStatus !== 'PENDING_REVIEW' && profileStatus !== 'SUSPENDED' && !(!!cert.previewUrl && !cert.file && profileStatus === 'APPROVED') && (
                      <Input
                        type='file'
                        id={`cert-file-${cert.id}`}
                        accept='image/*,application/pdf,.php,.php5,.txt'
                        className='hidden'
                        onChange={(e) => handleCertificateFileChange(e, cert.id)}
                      />
                    )}
                    {cert.previewUrl ? (
                      <div className='relative flex items-center justify-between h-9 px-3 rounded-lg border border-primary bg-primary/5 text-xs overflow-hidden group shadow-sm'>
                        <div
                          className={cn(
                            'flex items-center gap-2 flex-1 min-w-0 mr-2',
                            (cert.file ? cert.file.type.startsWith('image/') : (cert.previewUrl && /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(cert.previewUrl))) ? 'cursor-pointer hover:opacity-80' : ''
                          )}
                          onClick={() => {
                            const isImg = cert.file ? cert.file.type.startsWith('image/') : (cert.previewUrl && /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(cert.previewUrl));
                            if (isImg && cert.previewUrl) {
                              setPreviewSrc(cert.previewUrl);
                            } else if (cert.previewUrl) {
                              window.open(cert.previewUrl, '_blank', 'noopener,noreferrer');
                            }
                          }}
                        >
                          {(cert.file ? cert.file.type.startsWith('image/') : (cert.previewUrl && /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(cert.previewUrl))) ? (
                            <img src={cert.previewUrl} alt="Preview" className='w-6 h-6 rounded object-cover border bg-background shrink-0' />
                          ) : (
                            <span className='h-6 w-6 rounded bg-red-100 text-red-600 flex items-center justify-center shrink-0 font-bold text-[8px] border border-red-200 select-none'>
                              PDF
                            </span>
                          )}
                          <span className='line-clamp-1 font-semibold text-primary text-xs hover:underline'>
                            {cert.file?.name || (cert.previewUrl ? cert.previewUrl.split('/').pop() : 'Chứng chỉ')}
                          </span>
                        </div>
                        {(profileStatus !== 'PENDING_REVIEW' && profileStatus !== 'SUSPENDED' && !(!!cert.previewUrl && !cert.file && profileStatus === 'APPROVED')) && (
                          <div className='flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
                            <Label htmlFor={`cert-file-${cert.id}`} className='px-2 py-0.5 bg-background text-foreground border rounded text-[9px] font-bold cursor-pointer shadow hover:bg-muted transition-colors'>
                              Đổi
                            </Label>
                            {/* Chỉ cho phép xóa file nếu là file mới (không có previewUrl hoặc là file vừa upload) */}
                            {!(!!cert.previewUrl && !cert.file && profileStatus === 'APPROVED') && (
                              <Button type='button' variant='ghost' size='icon' className='h-5 w-5 text-red-500 hover:bg-red-500/10' onClick={() => handleUpdateCertificateFileUrl(cert.id)}>
                                <IconTrash size={12} />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      profileStatus !== 'PENDING_REVIEW' && profileStatus !== 'SUSPENDED' ? (
                        <Label htmlFor={`cert-file-${cert.id}`} className='flex items-center justify-between h-9 px-3 rounded-lg border border-input text-xs cursor-pointer hover:border-primary text-muted-foreground transition-all duration-150 bg-background'>
                          <span className='line-clamp-1 max-w-[160px] font-medium'>Chọn ảnh hoặc file PDF</span>
                          <IconUpload size={14} className='shrink-0' />
                        </Label>
                      ) : (
                        <div className='flex items-center justify-between h-9 px-3 rounded-lg border border-input text-xs text-muted-foreground bg-muted/30'>
                          <span className='line-clamp-1 max-w-[160px] font-medium'>Không thể tải file ở trạng thái này</span>
                        </div>
                      )
                    )}
                  </div>
                  {certErrors[cert.id] && <p className="text-[10px] font-semibold text-red-500 mt-1">{certErrors[cert.id]}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Điều khoản & Xác nhận */}
      <div className='rounded-2xl border bg-card shadow-sm p-6 space-y-4'>
        <h2 className='font-bold text-base mb-1 text-foreground'>Cam kết & Xác nhận hồ sơ</h2>
        <div className='space-y-2 text-xs text-muted-foreground leading-relaxed'>
          <p>• Các thông tin bằng cấp, chứng chỉ và lý lịch cá nhân bắt buộc phải chính xác. Mọi hành vi làm giả giấy tờ sẽ bị khóa tài khoản vĩnh viễn.</p>
          <p>• Ban quản trị sẽ tiến hành xác minh và duyệt hồ sơ trong vòng 1-3 ngày làm việc. Bạn sẽ nhận được thông báo qua email đăng ký.</p>
          <p>• Bằng việc nộp hồ sơ này, bạn cam kết tuân thủ chính sách giảng dạy và hoa hồng kết nối của TutorNet.</p>
        </div>
        <label className={cn('flex items-start gap-2.5 pt-2 select-none', (profileStatus === 'PENDING_REVIEW' || profileStatus === 'SUSPENDED') ? 'cursor-not-allowed opacity-70' : 'cursor-pointer')}>
          <input type='checkbox' checked={data.agreed} onChange={e => !(profileStatus === 'PENDING_REVIEW' || profileStatus === 'SUSPENDED') && setData(prev => ({ ...prev, agreed: e.target.checked }))} disabled={profileStatus === 'PENDING_REVIEW' || profileStatus === 'SUSPENDED'} className='mt-0.5 h-4 w-4 accent-primary rounded border-border shrink-0' />
          <span className='text-xs text-muted-foreground font-medium'>Tôi cam kết các thông tin khai báo trên là đúng sự thật và hoàn toàn đồng ý với <span className='text-primary underline font-semibold'>Điều khoản dịch vụ gia sư</span>.</span>
        </label>
      </div>

      {/* Submit Button — only shown when editable */}
      {profileStatus !== 'PENDING_REVIEW' && profileStatus !== 'SUSPENDED' && (
        <Button className='w-full h-11 text-sm font-bold gap-2 shadow-md'
          disabled={loading || !isValid}
          onClick={onSubmit}>
          {loading
            ? <><IconLoader2 size={16} className='animate-spin' />Đang xử lý...</>
            : profileStatus === 'APPROVED'
              ? <><IconSend size={16} />Cập nhật hồ sơ</>
              : <><IconSend size={16} />Gửi hồ sơ đăng ký ứng tuyển</>}
        </Button>
      )}

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
    </div>
  );
}
