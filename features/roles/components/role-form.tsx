'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { roleSchema, type RoleFormValues } from '../schemas/roles';
import { createRoleMutation, updateRoleMutation } from '../api/mutations';
import type { Role } from '../api/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { groupedPermissionsQueryOptions, roleKeys } from '../api/queries';
import { Skeleton } from '@/components/ui/skeleton';

export default function RoleForm({ initialData, pageTitle }: { initialData: Role | null; pageTitle: string }) {
  const router = useRouter();
  const isEdit = !!initialData;
  const queryClient = useQueryClient();

  const { data: groupedPermissions = [], isLoading: isLoadingPermissions } = useQuery(
    groupedPermissionsQueryOptions()
  );

  const createMutation = useMutation({
    ...createRoleMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
      toast.success('Tạo vai trò thành công');
      router.push('/admin/roles');
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Không thể tạo vai trò');
    }
  });

  const updateMutation = useMutation({
    ...updateRoleMutation,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(variables.id) });
      toast.success('Cập nhật vai trò thành công');
      router.push('/admin/roles');
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Không thể cập nhật vai trò');
    }
  });

  const isPending = isEdit ? updateMutation.isPending : createMutation.isPending;

  const form = useAppForm({
    defaultValues: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      description: initialData?.description || '',
      permissions: initialData?.permissions || []
    } as RoleFormValues,
    validators: {
      onSubmit: roleSchema
    },
    onSubmit: async ({ value }) => {
      // Map selected slugs back to numeric IDs for backend API sync
      const allPermissions = groupedPermissions.flatMap(gp => gp.permissions);
      const permissionIds = value.permissions
        .map(slug => allPermissions.find(p => p.slug === slug)?.id)
        .filter((id): id is number => id !== undefined);

      const payload = {
        name: value.name,
        slug: value.slug,
        description: value.description,
        permissions: permissionIds
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: initialData.id, values: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    }
  });

  const { FormTextField, FormTextareaField } = useFormFields<RoleFormValues>();

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle>{pageTitle}</CardTitle>
        <CardDescription>
          {isEdit ? 'Cập nhật thông tin chi tiết và phân quyền của vai trò.' : 'Tạo vai trò mới và gán các quyền hạn.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form id='role-form' className='space-y-8'>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-4'>
                <FormTextField name='name' label='Tên vai trò' placeholder='VD: Quản lý đào tạo' required />
                <FormTextField
                  name='slug'
                  label='Slug'
                  placeholder='VD: quan_ly_dao_tao'
                  required
                  disabled={isEdit}
                />
                <FormTextareaField name='description' label='Mô tả' placeholder='Chi tiết trách nhiệm công việc...' />
              </div>
            </div>

            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='text-lg font-medium'>Quyền hạn</h3>
                  <p className='text-sm text-muted-foreground'>
                    Chọn danh sách các quyền hạn được gán cho vai trò này.
                  </p>
                </div>
                {!isLoadingPermissions && groupedPermissions.length > 0 && (
                  <form.Field
                    name="permissions"
                    children={(field) => {
                      const allPermissionSlugs = groupedPermissions.flatMap(gp => gp.permissions.map(p => p.slug));
                      const isAllSelected = allPermissionSlugs.length > 0 && allPermissionSlugs.every(slug => field.state.value.includes(slug));
                      return (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (isAllSelected) {
                              field.handleChange([]);
                            } else {
                              field.handleChange(allPermissionSlugs);
                            }
                          }}
                        >
                          {isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        </Button>
                      );
                    }}
                  />
                )}
              </div>

              {isLoadingPermissions ? (
                <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                  {[1, 2, 3].map((n) => (
                    <Card key={n} className='shadow-none p-4 space-y-4'>
                      <Skeleton className='h-5 w-1/3' />
                      <div className='space-y-2'>
                        <Skeleton className='h-4 w-full' />
                        <Skeleton className='h-4 w-5/6' />
                        <Skeleton className='h-4 w-4/5' />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : groupedPermissions.length === 0 ? (
                <div className='text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg'>
                  Không tìm thấy quyền hạn nào từ hệ thống.
                </div>
              ) : (
                <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                  {groupedPermissions.map(group => {
                    const moduleName = group.module;
                    const modulePermissions = group.permissions;
                    const moduleSlugs = modulePermissions.map(p => p.slug);

                    return (
                      <Card key={moduleName} className='shadow-none'>
                        <CardHeader className='p-4 pb-2 flex flex-row items-center justify-between space-y-0'>
                          <CardTitle className='text-base capitalize'>{moduleName}</CardTitle>
                          <form.Field
                            name="permissions"
                            children={(field) => {
                              const isAllModuleSelected = moduleSlugs.length > 0 && moduleSlugs.every(slug => field.state.value.includes(slug));
                              return (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto p-0 text-xs text-muted-foreground hover:text-primary hover:bg-transparent"
                                  onClick={() => {
                                    const current = field.state.value;
                                    if (isAllModuleSelected) {
                                      field.handleChange(current.filter((slug: string) => !moduleSlugs.includes(slug)));
                                    } else {
                                      field.handleChange(Array.from(new Set([...current, ...moduleSlugs])));
                                    }
                                  }}
                                >
                                  {isAllModuleSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                </Button>
                              );
                            }}
                          />
                        </CardHeader>
                        <CardContent className='p-4 pt-0'>
                          <div className='space-y-2'>
                            {modulePermissions.map(permission => (
                              <form.Field
                                key={permission.id}
                                name='permissions'
                                children={(field) => {
                                  const checked = field.state.value.includes(permission.slug);
                                  return (
                                    <div className='flex items-start space-x-2'>
                                      <Checkbox
                                        id={permission.slug}
                                        checked={checked}
                                        onCheckedChange={(isChecked) => {
                                          const current = field.state.value;
                                          if (isChecked) {
                                            field.handleChange([...current, permission.slug]);
                                          } else {
                                            field.handleChange(current.filter((slug: string) => slug !== permission.slug));
                                          }
                                        }}
                                      />
                                      <div className='grid gap-1.5 leading-none'>
                                        <Label htmlFor={permission.slug} className='text-sm font-medium leading-none cursor-pointer'>
                                          {permission.name}
                                        </Label>
                                        {permission.description && (
                                          <p className='text-xs text-muted-foreground'>
                                            {permission.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }}
                              />
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            <div className='flex justify-end space-x-4'>
              <Button type='button' variant='outline' onClick={() => router.back()}>
                Hủy
              </Button>
              <Button type='submit' form='role-form' disabled={isPending || isLoadingPermissions}>
                {isPending ? 'Đang lưu...' : isEdit ? 'Cập nhật vai trò' : 'Tạo vai trò'}
              </Button>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
