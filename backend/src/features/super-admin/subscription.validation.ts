/**
 * Zod validation schemas for Subscription CRUD operations.
 */

import { z } from 'zod';

// ── Create Subscription Schema ───────────────────────────────────────────────
export const createSubscriptionSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),

  price: z
    .number()
    .min(0, 'Price cannot be negative'),

  duration: z
    .number()
    .int('Duration must be a whole number')
    .min(1, 'Duration must be at least 1 day'),

  maxSeats: z
    .number()
    .int('Max seats must be a whole number')
    .min(1, 'Max seats must be at least 1'),

  maxStaff: z
    .number()
    .int('Max staff must be a whole number')
    .min(1, 'Max staff must be at least 1')
    .default(5),

  features: z.array(z.string()).default([]),

  isActive: z.boolean().default(true),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;

// ── Update Subscription Schema ───────────────────────────────────────────────
export const updateSubscriptionSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  price: z.number().min(0).optional(),
  duration: z.number().int().min(1).optional(),
  maxSeats: z.number().int().min(1).optional(),
  maxStaff: z.number().int().min(1).optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
