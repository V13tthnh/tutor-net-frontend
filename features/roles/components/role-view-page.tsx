'use client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import { roleByIdOptions } from '../api/queries';
import RoleForm from './role-form';

function EditRoleView({ id }: { id: number }) {
  const { data } = useSuspenseQuery(roleByIdOptions(id));

  if (!data?.success || !data.role) notFound();

  return <RoleForm initialData={data.role} pageTitle='Edit Role' />;
}

export default function RoleViewPage({ roleId }: { roleId: string }) {
  if (roleId === 'new') return <RoleForm initialData={null} pageTitle='Create Role' />;

  const id = Number(roleId);
  if (isNaN(id)) notFound();

  return <EditRoleView id={id} />;
}
