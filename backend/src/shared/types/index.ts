/**
 * Shared TypeScript types used across the backend.
 */

import { Request } from 'express';
import { Role } from '../constants';

/** Authenticated user payload attached to req.user by JWT middleware */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  name: string;
  libraryId?: string; // Present for owner/manager/receptionist, absent for super_admin
}

/** Extended Express Request with authenticated user and tenant libraryId */
export interface AuthRequest extends Request {
  user: AuthUser;
  libraryId?: string;
}

/** Standard query params for paginated list endpoints */
export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

/** Generic paginated result */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Cloudinary upload result */
export interface CloudinaryResult {
  url: string;
  publicId: string;
}
