export type ListingStatus = 'available' | 'claimed' | 'completed' | 'expired';

export type ListingCategory =
  | 'produce'
  | 'dairy'
  | 'bakery'
  | 'grains'
  | 'proteins'
  | 'prepared'
  | 'non_perishable'
  | 'other';

export interface Listing {
  id: string;
  donorId: string;
  title: string;
  description: string;
  category: ListingCategory;
  quantity: number;
  unit: string;
  pickupAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  pickupDeadline: string;
  status: ListingStatus;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}
