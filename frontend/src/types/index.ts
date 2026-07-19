/**
 * Shared TypeScript types for the frontend.
 */

export type Role = 'super_admin' | 'owner' | 'manager' | 'receptionist';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  phone?: string;
  libraryId?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface Student {
  _id: string;
  studentId: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  photo?: string;
  idProof?: string;
  joinDate: string;
  plan: PlanType;
  shiftType?: string;
  shiftHours?: number;
  startTime?: string;
  endTime?: string;
  timeSlot?: string;
  seatId?: Seat | string;
  status: StudentStatus;
  notes?: string;
  createdBy?: User | string;
  createdAt: string;
  updatedAt: string;
}

export interface Seat {
  _id: string;
  seatNumber: string;
  floor: number;
  section: string;
  type: 'standard' | 'premium';
  status: SeatStatus;
  currentStudent?: Student | null;
  price: number;
  paidAmount?: number;
  reservedSeatCharge?: number | null;
  amenities: string[];
  notes?: string;
  createdBy?: User | string;
  createdAt: string;
}

export interface Payment {
  _id: string;
  receiptNumber: string;
  student: Student | string;
  seat?: Seat | string;
  amount: number;
  method: PaymentMethod;
  type: PaymentType;
  plan: PlanType;
  startDate: string;
  endDate: string;
  status: PaymentStatus;
  notes?: string;
  collectedBy: User | string;
  createdAt: string;
}

export interface Settings {
  library: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
    website?: string;
    gstNumber?: string;
  };
  plans: PlanConfig[];
  workingHours: { open: string; close: string; daysOpen: string[] };
  timezone: string;
  currency: string;
}

export interface PlanConfig {
  name: string;
  type: string;
  durationDays: number;
  price: number;
  isActive: boolean;
}

export interface DashboardStats {
  students: { total: number; active: number; newThisMonth: number; todaysAdmissions?: number };
  seats: { total: number; available: number; occupied: number; maintenance: number; occupancyRate: number };
  revenue: { thisMonth: number };
  recentPayments: Payment[];
  expiringSoon: Payment[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: { total: number; page: number; limit: number; totalPages: number };
}

export type StudentStatus = 'active' | 'inactive' | 'suspended';
export type SeatStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';
export type PlanType = 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | '30' | '60' | '90' | '180' | '365' | 'custom';
export type PaymentMethod = 'cash' | 'upi' | 'card';
export type PaymentType = 'new' | 'renewal' | 'penalty';
export type PaymentStatus = 'paid' | 'pending' | 'overdue';
export type LibraryStatus = 'active' | 'suspended' | 'deleted';
export type LibraryPaymentStatus = 'paid' | 'unpaid' | 'pending';

// ── Super Admin Types ────────────────────────────────────────────────────────

export interface Library {
  _id: string;
  name: string;
  owner: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    isActive: boolean;
    lastLogin?: string;
  } | string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  subscription: {
    _id: string;
    name: string;
    price: number;
    duration: number;
    maxSeats: number;
  } | string | null;
  paymentStatus: LibraryPaymentStatus;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  seatsLimit: number;
  status: LibraryStatus;
  createdBy: { _id: string; name: string; email: string } | string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  _id: string;
  name: string;
  price: number;
  duration: number;
  maxSeats: number;
  maxStaff: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  _id: string;
  action: string;
  performedBy: { _id: string; name: string; email: string } | string;
  targetType: 'library' | 'subscription' | 'user' | 'settings';
  targetId?: string;
  details: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface SuperAdminDashboardStats {
  libraries: {
    total: number;
    active: number;
    suspended: number;
    deleted: number;
    paid: number;
    unpaid: number;
    expiringSoon: number;
    expired: number;
  };
  subscriptions: {
    total: number;
    active: number;
  };
  users: {
    totalOwners: number;
    totalStaff: number;
  };
  students: {
    total: number;
    activeTotal: number;
  };
  revenue: {
    totalAllTime: number;
    thisMonth: number;
    lastMonth: number;
    growthPercentage: number;
  };
  attentionLibraries: Array<{
    _id: string;
    name: string;
    email: string;
    phone: string;
    paymentStatus: LibraryPaymentStatus;
    subscriptionEndDate?: string;
    subscriptionName?: string;
    status: LibraryStatus;
  }>;
  recentActivity: Array<{
    _id: string;
    action: string;
    details: string;
    createdAt: string;
    performedBy: { name: string; email: string } | null;
  }>;
}

export interface RevenueData {
  totalRevenue: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  revenueByLibrary: Array<{
    libraryId: string;
    libraryName: string;
    totalRevenue: number;
    thisMonthRevenue: number;
    planName: string;
    paymentStatus: string;
  }>;
}

export interface CreateLibraryCredentials {
  email: string;
  password: string;
  ownerName: string;
  libraryName: string;
}

export interface CreateLibraryResult {
  library: Library;
  credentials: CreateLibraryCredentials;
}
