import { api } from './api';

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: { listingId?: string; requestId?: string } | null;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const notificationsService = {
  getAll: async (params?: { page?: number; limit?: number }) => {
    const { data } = await api.get('/notifications', { params });
    return { notifications: data.data as AppNotification[], meta: data.meta as NotificationsMeta };
  },

  markAsRead: async (id: string) => {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data;
  },

  markAllAsRead: async () => {
    const { data } = await api.patch('/notifications/read-all');
    return data;
  },

  registerPushToken: async (token: string) => {
    const { data } = await api.post('/notifications/register-token', { token });
    return data;
  },

  getUnreadCount: async () => {
    const result = await notificationsService.getAll({ page: 1, limit: 50 });
    return result.notifications.filter((n) => !n.read).length;
  },
};
