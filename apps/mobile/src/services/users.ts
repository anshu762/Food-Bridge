import { api } from './api';

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  orgName?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  orgName: string | null;
  role: 'DONOR' | 'RECEIVER' | 'ADMIN';
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface VerificationDocument {
  id: string;
  documentUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export const usersService = {
  getProfile: async () => {
    const { data } = await api.get('/users/me');
    return data.data as UserProfile;
  },

  updateProfile: async (profile: UpdateProfileData) => {
    const { data } = await api.patch('/users/me', profile);
    return data.data as UserProfile;
  },

  changePassword: async (payload: ChangePasswordData) => {
    const { data } = await api.put('/users/me/password', payload);
    return data;
  },

  deleteAccount: async () => {
    const { data } = await api.delete('/users/me');
    return data;
  },

  getVerificationDocuments: async () => {
    const { data } = await api.get('/verification/documents');
    return data.data as VerificationDocument[];
  },

  uploadVerificationDocument: async (documentUrl: string) => {
    const { data } = await api.post('/verification/upload', { documentUrl });
    return data.data;
  },
};
