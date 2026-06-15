import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createUser, updateUser, deleteUser, resetPassword, updateAvatar, reviewClassRequest, bulkReviewClassRequests, forceCancelTutorInvitation } from './service';
import { userKeys, classRequestKeys, tutorInvitationKeys } from './queries';
import type { CreateUserPayload, UpdateUserPayload, ResetPasswordPayload, ReviewClassRequest, AdminCancelInvitationRequest } from './types';

export const createUserMutation = mutationOptions({
  mutationFn: (data: CreateUserPayload) => createUser(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: userKeys.all });
  }
});

export const updateUserMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: UpdateUserPayload }) =>
    updateUser(id, values),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: userKeys.all });
  }
});

export const updateAvatarMutation = mutationOptions({
  mutationFn: ({ id, file, avatarUrl }: { id: number; file?: File; avatarUrl?: string }) =>
    updateAvatar(id, file || avatarUrl || ''),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: userKeys.all });
  }
});

export const resetPasswordMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: number; data: ResetPasswordPayload }) =>
    resetPassword(id, data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: userKeys.all });
  }
});

export const deleteUserMutation = mutationOptions({
  mutationFn: (id: number) => deleteUser(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: userKeys.all });
  }
});

export const reviewClassRequestMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: number; data: ReviewClassRequest }) =>
    reviewClassRequest(id, data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: classRequestKeys.all });
  }
});

export const bulkReviewClassRequestsMutation = mutationOptions({
  mutationFn: ({ ids, data }: { ids: number[]; data: ReviewClassRequest }) =>
    bulkReviewClassRequests(ids, data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: classRequestKeys.all });
  }
});

export const forceCancelTutorInvitationMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: number; data: AdminCancelInvitationRequest }) =>
    forceCancelTutorInvitation(id, data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: tutorInvitationKeys.all });
  }
});
