/**
 * Super Admin API — all HTTP calls for the Super Admin Panel.
 *
 * Uses the shared axios instance which handles JWT tokens automatically.
 */

import { api } from '../../../lib/axios';
import type {
  ApiResponse,
  Library,
  Subscription,
  AuditLog,
  SuperAdminDashboardStats,
  RevenueData,
  CreateLibraryResult,
  User,
} from '../../../types';

const BASE = '/super-admin';

// ── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboard(): Promise<SuperAdminDashboardStats> {
  const { data } = await api.get<ApiResponse<SuperAdminDashboardStats>>(`${BASE}/dashboard`);
  return data.data;
}

// ── Libraries ────────────────────────────────────────────────────────────────

export interface LibraryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'suspended' | 'deleted' | 'paid' | 'unpaid' | 'expiring_soon' | 'expired' | 'all';
  sort?: string;
  order?: 'asc' | 'desc';
}

export async function getLibraries(params?: LibraryQueryParams) {
  const { data } = await api.get<ApiResponse<Library[]>>(`${BASE}/libraries`, { params });
  return { libraries: data.data, meta: data.meta! };
}

export async function getLibraryById(id: string): Promise<Library> {
  const { data } = await api.get<ApiResponse<Library>>(`${BASE}/libraries/${id}`);
  return data.data;
}

export interface CreateLibraryPayload {
  libraryName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  password: string;
  confirmPassword: string;
  subscriptionId?: string;
  paymentStatus?: 'paid' | 'unpaid' | 'pending';
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  seatsLimit: number;
  status?: 'active' | 'suspended';
}

export async function createLibrary(payload: CreateLibraryPayload): Promise<CreateLibraryResult> {
  const { data } = await api.post<ApiResponse<CreateLibraryResult>>(`${BASE}/libraries`, payload);
  return data.data;
}

export interface UpdateLibraryPayload {
  libraryName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  subscriptionId?: string;
  paymentStatus?: 'paid' | 'unpaid' | 'pending';
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  seatsLimit?: number;
  status?: 'active' | 'suspended';
}

export async function updateLibrary(id: string, payload: UpdateLibraryPayload): Promise<Library> {
  const { data } = await api.put<ApiResponse<Library>>(`${BASE}/libraries/${id}`, payload);
  return data.data;
}

export async function suspendLibrary(id: string): Promise<Library> {
  const { data } = await api.patch<ApiResponse<Library>>(`${BASE}/libraries/${id}/suspend`);
  return data.data;
}

export async function activateLibrary(id: string): Promise<Library> {
  const { data } = await api.patch<ApiResponse<Library>>(`${BASE}/libraries/${id}/activate`);
  return data.data;
}

export async function deleteLibrary(id: string): Promise<void> {
  await api.delete(`${BASE}/libraries/${id}`);
}

// ── Subscriptions ────────────────────────────────────────────────────────────

export async function getSubscriptions(): Promise<Subscription[]> {
  const { data } = await api.get<ApiResponse<Subscription[]>>(`${BASE}/subscriptions`);
  return data.data;
}

export interface CreateSubscriptionPayload {
  name: string;
  price: number;
  duration: number;
  maxSeats: number;
  maxStaff: number;
  features: string[];
  isActive?: boolean;
}

export async function createSubscription(payload: CreateSubscriptionPayload): Promise<Subscription> {
  const { data } = await api.post<ApiResponse<Subscription>>(`${BASE}/subscriptions`, payload);
  return data.data;
}

export async function updateSubscription(id: string, payload: Partial<CreateSubscriptionPayload>): Promise<Subscription> {
  const { data } = await api.put<ApiResponse<Subscription>>(`${BASE}/subscriptions/${id}`, payload);
  return data.data;
}

export async function deleteSubscription(id: string): Promise<void> {
  await api.delete(`${BASE}/subscriptions/${id}`);
}

// ── Revenue ──────────────────────────────────────────────────────────────────

export async function getRevenue(): Promise<RevenueData> {
  const { data } = await api.get<ApiResponse<RevenueData>>(`${BASE}/revenue`);
  return data.data;
}

// ── Audit Logs ───────────────────────────────────────────────────────────────

export interface LogQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
}

export async function getLogs(params?: LogQueryParams) {
  const { data } = await api.get<ApiResponse<AuditLog[]>>(`${BASE}/logs`, { params });
  return { logs: data.data, meta: data.meta! };
}

// ── Profile ──────────────────────────────────────────────────────────────────

export async function getProfile(): Promise<User> {
  const { data } = await api.get<ApiResponse<User>>(`${BASE}/profile`);
  return data.data;
}

export async function updateProfile(payload: { name?: string; email?: string; phone?: string }): Promise<User> {
  const { data } = await api.put<ApiResponse<User>>(`${BASE}/profile`, payload);
  return data.data;
}

export async function changeAdminPassword(payload: { currentPassword: string; newPassword: string }): Promise<void> {
  await api.put(`${BASE}/profile/password`, payload);
}

export async function resetLibraryOwnerPassword(libraryId: string, newPassword: string): Promise<void> {
  await api.put(`${BASE}/libraries/${libraryId}/reset-owner-password`, { newPassword });
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<void> {
  await api.put(`${BASE}/users/${userId}/reset-password`, { newPassword });
}
