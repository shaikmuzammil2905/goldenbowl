import { Request } from 'express';

export type UserRole = 'ADMIN' | 'SUPPORT' | 'DELIVERY' | 'CUSTOMER';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  cognitoSub?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
