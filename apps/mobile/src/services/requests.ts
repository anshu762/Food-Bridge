import { api } from './api';

export interface FoodRequest {
  id: string;
  listingId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COLLECTED';
  message: string | null;
  createdAt: string;
  updatedAt: string;
  receiver?: {
    id: string;
    email: string;
    role: string;
  };
}

export const requestsService = {
  createRequest: async (listingId: string, message?: string) => {
    const { data } = await api.post('/requests', { listingId, message });
    return data.data;
  },
  
  approveRequest: async (requestId: string) => {
    const { data } = await api.patch(`/requests/${requestId}/approve`);
    return data.data;
  },
  
  rejectRequest: async (requestId: string) => {
    const { data } = await api.patch(`/requests/${requestId}/reject`);
    return data.data;
  },
  
  collectRequest: async (requestId: string) => {
    const { data } = await api.patch(`/requests/${requestId}/collect`);
    return data.data;
  },
  
  cancelRequest: async (requestId: string) => {
    const { data } = await api.patch(`/requests/${requestId}/cancel`);
    return data.data;
  }
};
