import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DraftListing {
  title: string;
  foodType: string;
  description: string;
  quantity: number;
  unit: 'KG' | 'LITER' | 'ITEM' | 'PORTION';
  preparedAt: string;
  safeUntil: string;
  photos: string[]; // local URIs or Cloudinary URLs
  pickupLat?: number;
  pickupLng?: number;
  pickupAddress?: string;
}

interface DraftStoreState {
  draft: Partial<DraftListing>;
  setDraft: (data: Partial<DraftListing>) => void;
  clearDraft: () => void;
}

export const useDraftStore = create<DraftStoreState>()(
  persist(
    (set) => ({
      draft: {},
      setDraft: (data) => set((state) => ({ draft: { ...state.draft, ...data } })),
      clearDraft: () => set({ draft: {} }),
    }),
    {
      name: 'listing-draft-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
