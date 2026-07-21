/**
 * Application-wide constants.
 * Centralized here to avoid magic strings scattered through the codebase.
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  OWNER: 'owner',
  MANAGER: 'manager',
  RECEPTIONIST: 'receptionist',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const LIBRARY_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
} as const;

export type LibraryStatus = (typeof LIBRARY_STATUS)[keyof typeof LIBRARY_STATUS];

export const LIBRARY_PAYMENT_STATUS = {
  PAID: 'paid',
  UNPAID: 'unpaid',
  PENDING: 'pending',
  TRIAL: 'trial',
} as const;

export type LibraryPaymentStatus = (typeof LIBRARY_PAYMENT_STATUS)[keyof typeof LIBRARY_PAYMENT_STATUS];

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

export const SEAT_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  MAINTENANCE: 'maintenance',
} as const;

export type SeatStatus = (typeof SEAT_STATUS)[keyof typeof SEAT_STATUS];

export const SEAT_TYPE = {
  STANDARD: 'standard',
  PREMIUM: 'premium',
} as const;

export type SeatType = (typeof SEAT_TYPE)[keyof typeof SEAT_TYPE];

export const STUDENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
} as const;

export type StudentStatus = (typeof STUDENT_STATUS)[keyof typeof STUDENT_STATUS];

export const PLAN_TYPE = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  HALF_YEARLY: 'half-yearly',
  YEARLY: 'yearly',
  DAYS_30: '30',
  DAYS_60: '60',
  DAYS_90: '90',
  DAYS_180: '180',
  DAYS_365: '365',
  CUSTOM: 'custom',
} as const;

export type PlanType = (typeof PLAN_TYPE)[keyof typeof PLAN_TYPE];

export const PAYMENT_METHOD = {
  CASH: 'cash',
  UPI: 'upi',
  CARD: 'card',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const PAYMENT_TYPE = {
  NEW: 'new',
  RENEWAL: 'renewal',
  PENALTY: 'penalty',
} as const;

export type PaymentType = (typeof PAYMENT_TYPE)[keyof typeof PAYMENT_TYPE];

export const PAYMENT_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  OVERDUE: 'overdue',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

// Pagination defaults
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// Upload limits
export const MAX_FILE_SIZE_MB = 5;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
