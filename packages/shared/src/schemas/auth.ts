import { z } from 'zod';

const baseRegisterSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
  name: z.string().min(2, { message: 'Name must be at least 2 characters long' }),
  phone: z.string().optional(),
});

export const registerSchema = z.discriminatedUnion('role', [
  baseRegisterSchema.extend({
    role: z.literal('DONOR'),
    orgName: z.string().min(2, { message: 'Organization name is required for donors' }),
  }),
  baseRegisterSchema.extend({
    role: z.literal('RECEIVER'),
    // orgName is optional here to support "individual RECEIVER"
    orgName: z.string().optional(),
  }),
]);

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export type LoginInput = z.infer<typeof loginSchema>;
