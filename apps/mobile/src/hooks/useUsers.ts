import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService, UpdateProfileData, ChangePasswordData } from '../services/users';
import { useAuthStore } from '../store/authStore';

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => usersService.getProfile(),
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileData) => usersService.updateProfile(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore
          .getState()
          .login(
            {
              ...currentUser,
              name: result.name || undefined,
              orgName: result.orgName || undefined,
            },
            useAuthStore.getState().accessToken!,
            '',
          );
      }
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordData) => usersService.changePassword(data),
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => usersService.deleteAccount(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

export const useVerificationDocuments = () => {
  return useQuery({
    queryKey: ['verification-documents'],
    queryFn: () => usersService.getVerificationDocuments(),
  });
};

export const useUploadVerificationDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentUrl: string) => usersService.uploadVerificationDocument(documentUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-documents'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};
