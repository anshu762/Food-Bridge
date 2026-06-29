import { z } from 'zod';

export const createListingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  foodType: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.enum(['KG', 'LITER', 'ITEM', 'PORTION']),
  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),
  pickupAddress: z.string().min(5),
  photos: z.array(z.string().url()).min(1),
  preparedAt: z
    .string()
    .datetime()
    .refine((val) => new Date(val) <= new Date(), { message: 'preparedAt must be in the past' }),
  safeUntil: z
    .string()
    .datetime()
    .refine((val) => new Date(val) > new Date(), { message: 'safeUntil must be in the future' }),
});

export const getListingsQuerySchema = z
  .object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(20),
    status: z.enum(['AVAILABLE', 'RESERVED', 'COLLECTED', 'CANCELLED']).default('AVAILABLE'),
    foodType: z.string().optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radiusKm: z.coerce.number().min(1).optional(),
  })
  .refine(
    (data) => {
      if (data.radiusKm && (data.lat === undefined || data.lng === undefined)) {
        return false;
      }
      return true;
    },
    { message: 'lat and lng must be provided if radiusKm is provided' },
  );
