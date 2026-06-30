import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/admin';

export const useAdminUsers = (search?: string, role?: string, verificationStatus?: string) => {
  return useInfiniteQuery({
    queryKey: ['admin-users', search, role, verificationStatus],
    queryFn: ({ pageParam = 1 }) =>
      adminService.getUsers(pageParam as number, search, role, verificationStatus),
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
};

export const useAdminListings = (status?: string) => {
  return useInfiniteQuery({
    queryKey: ['admin-listings', status],
    queryFn: ({ pageParam = 1 }) => adminService.getListings(pageParam as number, status),
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
};

export const useRemoveListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminService.removeListing(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-listings'] });
    },
  });
};

export const usePendingVerifications = () => {
  return useQuery({
    queryKey: ['admin-verifications', 'pending'],
    queryFn: () => adminService.getPendingVerifications(),
  });
};

export const useApproveVerification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.approveVerification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verifications', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
};

export const useRejectVerification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminService.rejectVerification(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verifications', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
};
