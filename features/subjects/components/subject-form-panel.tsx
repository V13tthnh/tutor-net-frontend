'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createSubjectMutation, updateSubjectMutation } from '../api/mutations';
import { subjectTreeQueryOptions, subjectKeys } from '../api/queries';
import { getQueryClient } from '@/lib/query-client';
import type { Subject } from '../api/types';
import { toast } from 'sonner';
import { slugify } from '@/lib/slugify';
import { subjectSchema } from '../schemas/subject';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface SubjectFormPanelProps {
  subject?: Subject | null;
  defaultParentId?: number | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Các key của form state (dùng cho kiểu lỗi)
type FormFieldKey = 'name' | 'slug' | 'description' | 'parentId' | 'iconUrl' | 'isActive' | 'sortOrder';

function buildParentOptions(subjects: Subject[], depth = 0): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (const s of subjects) {
    const prefix = depth > 0 ? '—'.repeat(depth) + ' ' : '';
    options.push({
      value: String(s.id),
      label: prefix + s.name
    });
    if (s.children && s.children.length > 0) {
      options.push(...buildParentOptions(s.children, depth + 1));
    }
  }
  return options;
}

export function SubjectFormPanel({
  subject,
  defaultParentId,
  onSuccess,
  onCancel
}: SubjectFormPanelProps) {
  const isEdit = !!subject;

  const { data: treeData } = useQuery(subjectTreeQueryOptions());
  const parentOptions = buildParentOptions(treeData?.data ?? []);

  // Form state
  const [name, setName] = useState(subject?.name ?? '');
  const [slug, setSlug] = useState(subject?.slug ?? '');
  const [description, setDescription] = useState(subject?.description ?? '');
  const [parentId, setParentId] = useState<string>(
    subject?.parentId != null ? String(subject.parentId) : defaultParentId != null ? String(defaultParentId) : ''
  );
  const [iconUrl, setIconUrl] = useState(subject?.iconUrl ?? '');
  const [isActive, setIsActive] = useState(subject?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState(String(subject?.sortOrder ?? 0));

  // Errors
  const [errors, setErrors] = useState<Partial<Record<FormFieldKey, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSlugLoading, setIsSlugLoading] = useState(false);

  // Auto-slug on name blur
  const slugManuallyEdited = useRef(false);

  const handleNameBlur = () => {
    if (!slugManuallyEdited.current && name.trim()) {
      setIsSlugLoading(true);
      setErrors((prev) => ({ ...prev, slug: undefined }));
      setTimeout(() => {
        setSlug(slugify(name));
        setIsSlugLoading(false);
      }, 800); // Giả lập loading 800ms
    }
  };

  // Reset when subject changes
  useEffect(() => {
    slugManuallyEdited.current = false;
    setName(subject?.name ?? '');
    setSlug(subject?.slug ?? '');
    setDescription(subject?.description ?? '');
    setParentId(
      subject?.parentId != null ? String(subject.parentId) : defaultParentId != null ? String(defaultParentId) : ''
    );
    setIconUrl(subject?.iconUrl ?? '');
    setIsActive(subject?.isActive ?? true);
    setSortOrder(String(subject?.sortOrder ?? 0));
    setErrors({});
    setIsSlugLoading(false);
  }, [subject, defaultParentId]);

  const createMutation = useMutation({
    ...createSubjectMutation,
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: subjectKeys.all });
      toast.success('Tạo môn học thành công');
      // Reset form
      slugManuallyEdited.current = false;
      setName('');
      setSlug('');
      setDescription('');
      setParentId(defaultParentId != null ? String(defaultParentId) : '');
      setIconUrl('');
      setIsActive(true);
      setSortOrder('0');
      setErrors({});
      onSuccess?.();
    },
    onError: () => toast.error('Tạo môn học thất bại')
  });

  const updateMutation = useMutation({
    ...updateSubjectMutation,
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: subjectKeys.all });
      toast.success('Cập nhật môn học thành công');
      onSuccess?.();
    },
    onError: () => toast.error('Cập nhật thất bại')
  });

  /**
   * Validate bằng Zod schema — đồng bộ hoàn toàn với SubjectRequest (Java backend).
   * Trả về object errors theo từng field.
   */
  const validate = (): Partial<Record<FormFieldKey, string>> => {
    const result = subjectSchema.safeParse({
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
      parentId: parentId ? Number(parentId) : null,
      iconUrl: iconUrl.trim() || undefined,
      isActive,
      sortOrder: Number(sortOrder)
    });

    if (result.success) return {};

    const fieldErrors: Partial<Record<FormFieldKey, string>> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as FormFieldKey;
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return fieldErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        parentId: parentId ? Number(parentId) : null,
        iconUrl: iconUrl.trim() || null,
        isActive,
        sortOrder: Number(sortOrder)
      };
      if (isEdit) {
        await updateMutation.mutateAsync({ id: subject.id, values: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPending = isSubmitting || createMutation.isPending || updateMutation.isPending;

  // Determine depth/level
  const level = parentId ? (parentOptions.find(o => o.value === parentId)?.label.match(/^—+/)?.[0].length ?? 0) + 1 : 0;
  const levelLabels = ['Cấp 1 — Nhóm môn', 'Cấp 2 — Môn học', 'Cấp 3+ — Chuyên đề'];

  return (
    <div className='flex flex-col'>
      {/* Header */}
      <div className='flex items-start justify-between gap-3 px-5 py-4'>
        <div>
          <div className='flex items-center gap-2.5'>
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              isEdit ? 'bg-amber-500/10' : 'bg-primary/10'
            )}>
              {isEdit
                ? <Icons.edit className='h-4 w-4 text-amber-500' />
                : <Icons.add className='h-4 w-4 text-primary' />
              }
            </div>
            <div>
              <h2 className='text-sm font-semibold leading-none'>
                {isEdit ? 'Chỉnh sửa môn học' : 'Thêm môn học mới'}
              </h2>
              <p className='mt-1 text-xs text-muted-foreground'>
                {isEdit
                  ? `Đang chỉnh sửa: ${subject.name}`
                  : levelLabels[Math.min(level, 2)]}
              </p>
            </div>
          </div>
        </div>
        {isEdit && (
          <Badge
            variant={subject.isActive ? 'default' : 'secondary'}
            className='shrink-0 mt-0.5'
          >
            {subject.isActive ? 'Hoạt động' : 'Đã ẩn'}
          </Badge>
        )}
      </div>

      <Separator />

      {/* Form body */}
      <div>
        <form id='subject-panel-form' onSubmit={handleSubmit} className='space-y-5 p-5'>
          {/* Name */}
          <div className='space-y-1.5'>
            <Label htmlFor='sf-name'>
              Tên môn học <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='sf-name'
              value={name}
              maxLength={200}
              onChange={(e) => {
                setName(e.target.value);
                // Nếu người dùng xóa sạch tên môn học, ta reset slug tự động nếu chưa chỉnh sửa thủ công
                if (!e.target.value.trim() && !slugManuallyEdited.current) {
                  setSlug('');
                }
              }}
              onBlur={handleNameBlur}
              placeholder='VD: Toán học, Tiếng Anh, IELTS...'
              className={cn(errors.name && 'border-destructive')}
            />
            {errors.name && <p className='text-xs text-destructive'>{errors.name}</p>}
          </div>

          {/* Slug */}
          <div className='space-y-1.5'>
            <Label htmlFor='sf-slug'>
              Slug{' '}
              <span className='text-[11px] text-muted-foreground font-normal'>
                (dùng trong URL)
              </span>{' '}
              <span className='text-destructive'>*</span>
            </Label>
            <div className='relative'>
              <Input
                id='sf-slug'
                value={slug}
                disabled={isSlugLoading}
                maxLength={200}
                onChange={(e) => {
                  slugManuallyEdited.current = true;
                  // Normalize: lowercase, replace invalid chars with -, collapse multiple -, trim -
                  const raw = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, '-')
                    .replace(/-{2,}/g, '-');
                  setSlug(raw);
                }}
                onBlur={(e) => {
                  // Trim leading/trailing dashes on blur to satisfy pattern
                  setSlug(e.target.value.replace(/^-+|-+$/g, ''));
                }}
                placeholder='toan-hoc'
                className={cn(
                  'font-mono text-sm pr-10',
                  errors.slug && 'border-destructive'
                )}
              />
              {isSlugLoading && (
                <div className='absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center'>
                  <Icons.spinner className='h-4 w-4 animate-spin text-primary' />
                </div>
              )}
            </div>
            {isSlugLoading ? (
              <p className='text-xs text-amber-500 flex items-center gap-1.5 animate-pulse'>
                <Icons.spinner className='h-3 w-3 animate-spin' />
                Đang tạo slug tự động...
              </p>
            ) : errors.slug ? (
              <p className='text-xs text-destructive'>{errors.slug}</p>
            ) : (
              !isEdit && (
                <p className='text-xs text-muted-foreground'>
                  Tự động tạo từ tên môn học. Không thay đổi sau khi xuất bản.
                </p>
              )
            )}
          </div>

          {/* Parent */}
          <div className='space-y-1.5'>
            <Label htmlFor='sf-parent'>Môn học cha</Label>
            <Select
              value={parentId === '' ? '__none__' : parentId}
              onValueChange={(val) => setParentId(val === '__none__' ? '' : val)}
            >
              <SelectTrigger id='sf-parent' className='w-full'>
                <SelectValue placeholder='Không có (nhóm gốc cấp 1)' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='__none__'>— Không có (nhóm gốc)</SelectItem>
                {parentOptions.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    disabled={isEdit && opt.value === String(subject?.id)}
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className='text-xs text-muted-foreground'>
              {!parentId
                ? 'Sẽ là nhóm môn cấp 1'
                : `Cấp ${Math.min(level + 1, 3)}${level >= 2 ? ' (chuyên đề)' : ''}`}
            </p>
          </div>

          {/* Description */}
          <div className='space-y-1.5'>
            <Label htmlFor='sf-desc'>
              Mô tả{' '}

            </Label>
            <Textarea
              id='sf-desc'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Mô tả ngắn gọn về nội dung môn học này...'
              rows={3}
              maxLength={5000}
              className={cn(errors.description && 'border-destructive')}
            />
            <div className='flex items-center justify-between'>
              {errors.description ? (
                <p className='text-xs text-destructive'>{errors.description}</p>
              ) : (
                <span />
              )}
              <p className='text-xs text-muted-foreground tabular-nums'>
                {description.length}/5000
              </p>
            </div>
          </div>

          {/* Icon URL */}
          <div className='space-y-1.5'>
            <Label htmlFor='sf-icon'>
              URL Icon{' '}
              <span className='text-[11px] text-muted-foreground font-normal'>(tùy chọn)</span>
            </Label>
            <Input
              id='sf-icon'
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
              placeholder='https://example.com/icon.png'
              type='url'
              className={cn(errors.iconUrl && 'border-destructive')}
            />
            {errors.iconUrl && <p className='text-xs text-destructive'>{errors.iconUrl}</p>}
          </div>

          {/* Sort order */}
          <div className='space-y-1.5'>
            <Label htmlFor='sf-order'>Thứ tự hiển thị</Label>
            <Input
              id='sf-order'
              type='number'
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className={cn(errors.sortOrder && 'border-destructive')}
            />
            {errors.sortOrder && (
              <p className='text-xs text-destructive'>{errors.sortOrder}</p>
            )}
            <p className='text-xs text-muted-foreground'>Số nhỏ hơn hiển thị trước</p>
          </div>

          {/* Active toggle */}
          <div className='flex items-center justify-between rounded-lg border p-3'>
            <div>
              <p className='text-sm font-medium'>Hiển thị công khai</p>
              <p className='text-xs text-muted-foreground mt-0.5'>
                Môn học ẩn không hiện với học sinh và gia sư
              </p>
            </div>
            <Switch
              id='sf-active'
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </form>
      </div>

      <Separator />

      {/* Footer */}
      <div className='flex items-center justify-between gap-3 px-5 py-3'>
        <p className='text-[11px] text-muted-foreground truncate'>
          {isEdit ? (
            <>
              Slug:{' '}
              <code className='rounded bg-muted px-1 py-0.5 font-mono text-foreground'>
                {subject.slug}
              </code>
            </>
          ) : (
            'Slug tự động tạo từ tên môn học'
          )}
        </p>
        <div className='flex shrink-0 gap-2'>
          {onCancel && (
            <Button type='button' variant='outline' size='sm' onClick={onCancel}>
              Hủy
            </Button>
          )}
          <Button
            type='submit'
            form='subject-panel-form'
            size='sm'
            disabled={isPending}
          >
            {isPending ? (
              <Icons.spinner className='mr-1.5 h-3.5 w-3.5 animate-spin' />
            ) : (
              <Icons.check className='mr-1.5 h-3.5 w-3.5' />
            )}
            {isEdit ? 'Lưu thay đổi' : 'Tạo môn học'}
          </Button>
        </div>
      </div>
    </div>
  );
}
