import { z } from 'zod';

export const createRequestSchema = z.object({
  listingId: z.string().uuid(),
  message: z.string().optional(),
});
