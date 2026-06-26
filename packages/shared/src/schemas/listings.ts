import { z } from 'zod';

export const createListingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(['produce', 'dairy', 'bakery', 'grains', 'proteins', 'prepared', 'non_perishable', 'other']),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  pickupAddress: z.string().min(5, 'Pickup address is required'),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  pickupDeadline: z.string().datetime('Invalid datetime format'),
  imageUrl: z.string().url().optional(),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
