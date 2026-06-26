export type UserRole = 'donor' | 'receiver' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationName?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}
