import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '../services/notifications';

export const useNotifications = (page: number, limit = 20) => {
  return useQuery({
    queryKey: ['notifications', page, limit],
    queryFn: () => notificationsService.getAll({ page, limit }),
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const result = await notificationsService.getAll({ page: 1, limit: 50 });
      return result.notifications.filter((n) => !n.read).length;
    },
    refetchInterval: 30000,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useRegisterPushToken = () => {
  return useMutation({
    mutationFn: (token: string) => notificationsService.registerPushToken(token),
  });
};
