import { api } from './api';

export interface CreateListingData {
  title: string;
  description?: string;
  foodType: string;
  quantity: number;
  unit: 'KG' | 'LITER' | 'ITEM' | 'PORTION';
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  photos: string[];
  preparedAt: string;
  safeUntil: string;
}

export interface Listing {
  id: string;
  donorId: string;
  title: string;
  description: string | null;
  foodType: string;
  quantity: number;
  unit: string;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  photos: string[];
  preparedAt: string;
  safeUntil: string;
  status: 'AVAILABLE' | 'RESERVED' | 'COLLECTED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export const listingsService = {
  getUploadSignature: async () => {
    const { data } = await api.post('/listings/upload-signature');
    return data.data; // { signature, timestamp, apiKey, cloudName }
  },
  
  createListing: async (listingData: CreateListingData) => {
    const { data } = await api.post('/listings', listingData);
    return data.data;
  },
  
  getMyListings: async (params?: any) => {
    const { data } = await api.get('/listings/mine', { params });
    return data.data as Listing[]; // array of listings
  },
  
  getListing: async (id: string) => {
    const { data } = await api.get(`/listings/${id}`);
    return data.data as Listing & {
      requests: any[];
    };
  },
  
  cancelListing: async (id: string) => {
    const { data } = await api.delete(`/listings/${id}`);
    return data.data;
  }
};
