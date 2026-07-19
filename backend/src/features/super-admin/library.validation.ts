/**
 * Zod validation schemas for Library CRUD operations.
 *
 * Used with the validateZod middleware in super-admin routes.
 */

import { z } from 'zod';

// ── Create Library Schema ────────────────────────────────────────────────────
export const createLibrarySchema = z
  .object({
    libraryName: z
      .string()
      .min(2, 'Library name must be at least 2 characters')
      .max(200, 'Library name cannot exceed 200 characters')
      .trim(),

    ownerName: z
      .string()
      .min(2, 'Owner name must be at least 2 characters')
      .max(100, 'Owner name cannot exceed 100 characters')
      .trim(),

    email: z
      .string()
      .email('Please provide a valid email address')
      .toLowerCase()
      .trim(),

    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian phone number'),

    address: z
      .string()
      .min(5, 'Address must be at least 5 characters')
      .max(500, 'Address cannot exceed 500 characters')
      .trim(),

    city: z
      .string()
      .min(2, 'City must be at least 2 characters')
      .max(100, 'City cannot exceed 100 characters')
      .trim(),

    state: z
      .string()
      .min(2, 'State must be at least 2 characters')
      .max(100, 'State cannot exceed 100 characters')
      .trim(),

    pinCode: z
      .string()
      .regex(/^\d{6}$/, 'Pin code must be exactly 6 digits'),

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and a number'
      ),

    confirmPassword: z.string(),

    subscriptionId: z.string().optional(),

    paymentStatus: z.enum(['paid', 'unpaid', 'pending']).default('paid'),

    subscriptionStartDate: z.string().optional(),
    subscriptionEndDate: z.string().optional(),

    seatsLimit: z
      .number()
      .int('Seats limit must be a whole number')
      .min(1, 'Seats limit must be at least 1')
      .max(10000, 'Seats limit cannot exceed 10,000'),

    status: z.enum(['active', 'suspended']).default('active'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type CreateLibraryInput = z.infer<typeof createLibrarySchema>;

// ── Update Library Schema ────────────────────────────────────────────────────
export const updateLibrarySchema = z.object({
  libraryName: z.string().min(2).max(200).trim().optional(),
  email: z.string().email().toLowerCase().trim().optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number').optional(),
  address: z.string().min(5).max(500).trim().optional(),
  city: z.string().min(2).max(100).trim().optional(),
  state: z.string().min(2).max(100).trim().optional(),
  pinCode: z.string().regex(/^\d{6}$/, 'Pin code must be 6 digits').optional(),
  subscriptionId: z.string().optional(),
  paymentStatus: z.enum(['paid', 'unpaid', 'pending']).optional(),
  subscriptionStartDate: z.string().optional(),
  subscriptionEndDate: z.string().optional(),
  seatsLimit: z.number().int().min(1).max(10000).optional(),
  status: z.enum(['active', 'suspended']).optional(),
});

export type UpdateLibraryInput = z.infer<typeof updateLibrarySchema>;

// ── Library Query Schema (for GET /libraries) ────────────────────────────────
export const libraryQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  search: z.string().optional(),
  status: z
    .enum(['active', 'suspended', 'deleted', 'paid', 'unpaid', 'expiring_soon', 'expired', 'all'])
    .optional()
    .default('all'),
  sort: z.string().optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type LibraryQueryInput = z.infer<typeof libraryQuerySchema>;
