'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { Tutor } from '@/constants/mock-api-tutors';
import { IconX } from '@tabler/icons-react';
import Image from 'next/image';
import { getAvatarUrl } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { apiClient } from '@/lib/api-client';

interface TutorInviteModalProps {
  tutor: Tutor | null;
  open: boolean;
  onClose: () => void;
}

export function TutorInviteModal({ tutor, open, onClose }: TutorInviteModalProps) {
  const { user } = useAuthSession();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(user?.fullName || '');
      setPhone('');
      setEmail(user?.email || '');
      setMessage('');
      setErrors({});
      setSubmitting(false);

      if (user?.id) {
        apiClient<{ success: boolean; data: any }>(`/users/${user.id}`)
          .then((res) => {
            if (res.success) {
              if (res.data?.phone) {
                setPhone(res.data.phone);
              }
              if (res.data?.email) {
                setEmail(res.data.email);
              }
            }
          })
          .catch((err) => {
            console.error('Failed to fetch user details:', err);
          });
      }
    }
  }, [open, user]);

  if (!tutor) return null;

  const tutorCode = `GS${String(tutor.id).padStart(4, '0')}`;
  const occupation = tutor.age <= 26 ? 'Sinh viên' : 'Giáo viên';
  const fullName = `${tutor.first_name} ${tutor.last_name}`;
  const avatar = getAvatarUrl(tutor.avatar_url);
  const fallbackAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + tutor.id;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const newErrors: { name?: string; phone?: string; email?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Vui lòng nhập tên phụ huynh hoặc học sinh';
    }
    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập địa chỉ email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Địa chỉ email không hợp lệ';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại liên hệ';
    } else if (!/^[0-9+()#.\s-]{9,15}$/.test(phone.trim())) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    const payload = {
      fullName: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      message: message.trim() || null
    };

    apiClient(`/tutors/${tutor.id}/invite`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
      .then((res: any) => {
        toast.success(`Đã gửi yêu cầu mời dạy đến gia sư ${fullName} thành công!`);
        onClose();
      })
      .catch((err: any) => {
        toast.error(err?.message || 'Có lỗi xảy ra khi gửi yêu cầu mời dạy.');
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !submitting && onClose()}>
      <DialogContent
        className='flex w-[95vw] max-w-md flex-col overflow-hidden rounded-lg border bg-background p-0 gap-0 shadow-2xl [&>button]:hidden'
        hideCloseButton
      >
        <DialogTitle className='sr-only'>Mời gia sư {fullName} dạy học</DialogTitle>

        {/* ══ HEADER ══ */}
        <header className='flex shrink-0 items-center justify-between px-6 py-4 bg-primary text-primary-foreground'>
          <span className='font-bold text-base tracking-wide'>
            Mời gia sư dạy học
          </span>
          <button
            type='button'
            onClick={onClose}
            aria-label='Đóng'
            className='rounded-full p-1.5 transition-colors hover:bg-primary-foreground/10 text-primary-foreground cursor-pointer'
          >
            <IconX size={18} />
          </button>
        </header>

        {/* ══ BODY ══ */}
        <form onSubmit={handleSubmit} className='p-6 space-y-5'>
          {/* Tutor Summary Card */}
          <div className='flex items-center gap-4 border-b pb-4'>
            <div className='h-12 w-12 overflow-hidden rounded-full ring-2 ring-primary/20 ring-offset-2 ring-offset-background shrink-0'>
              <Image
                src={avatar || fallbackAvatar}
                alt={fullName}
                width={48}
                height={48}
                className='h-full w-full object-cover'
                unoptimized
              />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='text-sm font-semibold text-foreground truncate'>
                {tutorCode}: {fullName} - {occupation} ({tutor.province})
              </p>
            </div>
          </div>

          <p className='text-xs text-muted-foreground leading-normal'>
            Phụ huynh/học sinh để lại thông tin, gia sư sẽ liên hệ dạy học ngay!
          </p>

          {/* Form Fields */}
          <div className='space-y-4'>
            {/* Tên PH/HS */}
            <div className='space-y-1.5'>
              <Label htmlFor='invite-name' className='text-xs font-semibold text-foreground'>
                Tên phụ huynh/học sinh <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='invite-name'
                disabled={submitting}
                placeholder='Tên phụ huynh/học sinh*'
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) {
                    setErrors((prev) => ({ ...prev, name: undefined }));
                  }
                }}
                className={errors.name ? 'border-destructive focus-visible:ring-destructive/30' : ''}
              />
              {errors.name && (
                <p className='text-xs text-destructive'>{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className='space-y-1.5'>
              <Label htmlFor='invite-email' className='text-xs font-semibold text-foreground'>
                Địa chỉ email <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='invite-email'
                disabled={submitting}
                placeholder='Địa chỉ email*'
                type='email'
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                className={errors.email ? 'border-destructive focus-visible:ring-destructive/30' : ''}
              />
              {errors.email && (
                <p className='text-xs text-destructive'>{errors.email}</p>
              )}
            </div>

            {/* Số điện thoại */}
            <div className='space-y-1.5'>
              <Label htmlFor='invite-phone' className='text-xs font-semibold text-foreground'>
                Số điện thoại <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='invite-phone'
                disabled={submitting}
                placeholder='Số điện thoại*'
                type='tel'
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) {
                    setErrors((prev) => ({ ...prev, phone: undefined }));
                  }
                }}
                className={errors.phone ? 'border-destructive focus-visible:ring-destructive/30' : ''}
              />
              {errors.phone && (
                <p className='text-xs text-destructive'>{errors.phone}</p>
              )}
            </div>

            {/* Lời nhắn */}
            <div className='space-y-1.5'>
              <Label htmlFor='invite-message' className='text-xs font-semibold text-foreground'>
                Lời nhắn
              </Label>
              <Textarea
                id='invite-message'
                disabled={submitting}
                placeholder='Lời nhắn'
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className='flex gap-3 pt-2'>
            <Button
              type='button'
              variant='outline'
              disabled={submitting}
              onClick={onClose}
              className='flex-1 h-10 cursor-pointer'
            >
              Hủy
            </Button>
            <Button
              type='submit'
              disabled={submitting}
              className='flex-1 h-10 cursor-pointer'
            >
              {submitting ? 'Đang gửi...' : 'Xác nhận'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
