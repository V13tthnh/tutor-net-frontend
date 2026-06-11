import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createSubject, updateSubject, deleteSubject, reorderSubject } from './service';
import { subjectKeys } from './queries';
import type { CreateSubjectPayload, UpdateSubjectPayload } from './types';

export const createSubjectMutation = mutationOptions({
  mutationFn: (data: CreateSubjectPayload) => createSubject(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: subjectKeys.all });
  }
});

export const updateSubjectMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: UpdateSubjectPayload }) =>
    updateSubject(id, values),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: subjectKeys.all });
  }
});

export const deleteSubjectMutation = mutationOptions({
  mutationFn: (id: number) => deleteSubject(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: subjectKeys.all });
  }
});

export const reorderSubjectMutation = mutationOptions({
  mutationFn: ({ id, parentId, sortOrder }: { id: number; parentId: number | null; sortOrder: number }) =>
    reorderSubject(id, { parentId, sortOrder }),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: subjectKeys.all });
  }
});
