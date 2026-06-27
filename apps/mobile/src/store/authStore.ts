import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

// Make sure these match the shared types from backend
export type Role = 'DONOR' | 'RECEIVER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name?: string;
  orgName?: string;
  role: Role;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isHydrated: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateToken: (accessToken: string) => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isHydrated: false,

  login: async (user, accessToken, refreshToken) => {
    await Promise.all([
      SecureStore.setItemAsync('user', JSON.stringify(user)),
      SecureStore.setItemAsync('accessToken', accessToken),
      SecureStore.setItemAsync('refreshToken', refreshToken),
    ]);
    set({ user, accessToken, isHydrated: true });

    // Route based on role
    if (user.role === 'DONOR') router.replace('/(donor)');
    else if (user.role === 'RECEIVER') router.replace('/(receiver)');
    else if (user.role === 'ADMIN') router.replace('/(admin)');
  },

  logout: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync('user'),
      SecureStore.deleteItemAsync('accessToken'),
      SecureStore.deleteItemAsync('refreshToken'),
    ]);
    set({ user: null, accessToken: null });
    router.replace('/(auth)/login');
  },

  updateToken: (accessToken: string) => {
    SecureStore.setItemAsync('accessToken', accessToken);
    set({ accessToken });
  },

  hydrate: async () => {
    try {
      const [userStr, accessToken] = await Promise.all([
        SecureStore.getItemAsync('user'),
        SecureStore.getItemAsync('accessToken'),
      ]);

      if (userStr && accessToken) {
        set({ user: JSON.parse(userStr), accessToken, isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    } catch (e) {
      console.error('Hydration error:', e);
      set({ isHydrated: true });
    }
  },
}));
