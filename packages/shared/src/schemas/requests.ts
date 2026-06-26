import { z } from 'zod';

export const createRequestSchema = z.object({
  listingId: z.string().uuid('Invalid listing ID'),
  quantity: z.number().positive('Quantity must be positive'),
  message: z.string().max(500).optional(),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
