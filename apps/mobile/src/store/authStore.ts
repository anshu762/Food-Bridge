import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Make sure these match the shared types from backend
export type Role = 'DONOR' | 'RECEIVER' | 'ADMIN';

/**
 * Web-safe storage wrapper.
 * expo-secure-store is native-only (Android/iOS).
 * On web, we fall back to localStorage which is acceptable for local dev/testing.
 * In production, the app runs on native so SecureStore is always used.
 *
 * NOTE: We do NOT import `router` from expo-router here.
 * Calling router.replace() from a Zustand store (outside NavigationContainer)
 * causes "Couldn't find a navigation context" errors.
 * Instead, _layout.tsx watches `user` state and handles all routing reactively.
 */
const storage = {
  get: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  set: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  del: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

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
  // login sets state only — _layout.tsx useEffect handles the actual navigation
  login: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  // logout clears state only — _layout.tsx useEffect navigates to login
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
      storage.set('user', JSON.stringify(user)),
      storage.set('accessToken', accessToken),
      storage.set('refreshToken', refreshToken),
    ]);
    // Only update state. Navigation is handled reactively by _layout.tsx
    set({ user, accessToken, isHydrated: true });
  },

  logout: async () => {
    await Promise.all([
      storage.del('user'),
      storage.del('accessToken'),
      storage.del('refreshToken'),
    ]);
    // Only update state. Navigation is handled reactively by _layout.tsx
    set({ user: null, accessToken: null });
  },

  updateToken: (accessToken: string) => {
    storage.set('accessToken', accessToken);
    set({ accessToken });
  },

  hydrate: async () => {
    try {
      const [userStr, accessToken] = await Promise.all([
        storage.get('user'),
        storage.get('accessToken'),
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
