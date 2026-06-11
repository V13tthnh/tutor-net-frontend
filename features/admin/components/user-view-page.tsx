'use client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import { userByIdOptions } from '../api/queries';
import UserForm from './user-form';
import UserEditForm from './user-edit-form';

function EditUserView({ id }: { id: number }) {
  const { data } = useSuspenseQuery(userByIdOptions(id));

  if (!data?.success || !data.user) notFound();

  return <UserEditForm user={data.user} />;
}

export default function UserViewPage({ userId }: { userId: string }) {
  if (userId === 'new') return <UserForm initialData={null} pageTitle='Tạo tài khoản quản trị viên' />;

  const id = Number(userId);
  if (isNaN(id)) notFound();

  return <EditUserView id={id} />;
}
