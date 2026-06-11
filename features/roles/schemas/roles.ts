import { z } from 'zod';

export const roleSchema = z.object({
  name: z.string()
    .min(2, 'Tên vai trò phải từ 2 ký tự trở lên')
    .max(50, 'Tên vai trò không được quá 50 ký tự'),

  slug: z.string()
    .min(2, 'Slug phải từ 2 ký tự trở lên')
    .max(50, 'Slug không được quá 50 ký tự')
    .regex(/^[a-z0-9_]+$/, 'Slug chỉ bao gồm chữ thường, số và dấu gạch dưới'),

  description: z.string()
    .max(255, 'Mô tả không được quá 255 ký tự'),

  permissions: z.array(z.string())
});

export type RoleFormValues = z.infer<typeof roleSchema>;