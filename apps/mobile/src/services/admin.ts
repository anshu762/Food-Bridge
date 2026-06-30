import { api } from './api';

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UserDTO {
  id: string;
  email: string;
  name: string | null;
  orgName: string | null;
  role: 'DONOR' | 'RECEIVER' | 'ADMIN';
  verificationStatus: VerificationStatus;
  phone: string | null;
  createdAt: string;
}

export interface VerificationDocument {
  id: string;
  userId: string;
  documentType: string;
  documentUrl: string;
  status: VerificationStatus;
  reviewedAt: string | null;
  createdAt: string;
  user?: UserDTO;
}

export const adminService = {
  getUsers: async (page = 1, search?: string, role?: string, verificationStatus?: string) => {
    const params = new URLSearchParams({ page: page.toString() });
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    if (verificationStatus) params.append('verificationStatus', verificationStatus);

    const { data } = await api.get(`/admin/users?${params.toString()}`);
    return data;
  },

  getListings: async (page = 1, status?: string) => {
    const params = new URLSearchParams({ page: page.toString() });
    if (status) params.append('status', status);

    const { data } = await api.get(`/admin/listings?${params.toString()}`);
    return data;
  },

  removeListing: async (id: string, reason: string) => {
    const { data } = await api.patch(`/admin/listings/${id}/remove`, { reason });
    return data;
  },

  getPendingVerifications: async () => {
    const { data } = await api.get('/verification/pending');
    return data;
  },

  approveVerification: async (id: string) => {
    const { data } = await api.patch(`/verification/${id}/approve`);
    return data;
  },

  rejectVerification: async (id: string, reason: string) => {
    const { data } = await api.patch(`/verification/${id}/reject`, { reason });
    return data;
  },
};
