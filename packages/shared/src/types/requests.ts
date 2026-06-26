export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export interface Request {
  id: string;
  listingId: string;
  receiverId: string;
  quantity: number;
  message?: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}
