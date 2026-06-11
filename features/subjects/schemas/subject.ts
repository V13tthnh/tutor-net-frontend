import { z } from 'zod';

// Đồng bộ với SubjectRequest (Java backend)
export const subjectSchema = z.object({
  // nullable — null = danh mục gốc
  parentId: z.number().nullable(),

  // @NotBlank @Size(max = 200)
  name: z
    .string()
    .min(1, 'Tên môn học không được để trống')
    .max(200, 'Tên không vượt quá 200 ký tự'),

  // @NotBlank @Size(max = 200) @Pattern(^[a-z0-9]+(?:-[a-z0-9]+)*$)
  slug: z
    .string()
    .min(1, 'Slug không được để trống')
    .max(200, 'Slug không vượt quá 200 ký tự')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug chỉ gồm chữ thường, số và dấu gạch ngang (ví dụ: toan-hoc)'
    ),

  // @Size(max = 5000) — nullable, tùy chọn
  description: z
    .string()
    .max(5000, 'Mô tả không vượt quá 5000 ký tự')
    .optional()
    .or(z.literal('')),

  // nullable, tùy chọn
  iconUrl: z
    .string()
    .url('URL icon không hợp lệ (phải bắt đầu bằng http/https)')
    .nullable()
    .optional()
    .or(z.literal('')),

  // default true
  isActive: z.boolean(),

  // @Min(0) default 0
  sortOrder: z.number().int().min(0, 'Thứ tự hiển thị phải >= 0')
});

export type SubjectFormValues = z.infer<typeof subjectSchema>;
