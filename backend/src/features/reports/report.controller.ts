import { Response } from 'express';
import { AuthRequest } from '../../shared/types';
import { successResponse } from '../../shared/helpers/api-response';
import { getDashboardStats, getMonthlyRevenueTrend, getExpiringMembers, getOccupancyReport, getPaymentMethodStats } from './report.service';

export async function dashboardStats(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? (req.query.libraryId as string) : req.libraryId;
  const stats = await getDashboardStats(libId);

  // Receptionist role is not allowed to view financial revenue figures
  if (req.user.role === 'receptionist') {
    stats.revenue = { today: 0, thisMonth: 0 };
    if (stats.recentPayments) {
      stats.recentPayments = stats.recentPayments.map((p: any) => {
        const item = typeof p.toObject === 'function' ? p.toObject() : { ...p };
        item.amount = 0;
        return item;
      });
    }
  }

  successResponse(res, stats, 'Dashboard statistics fetched');
}

export async function revenueTrend(req: AuthRequest, res: Response): Promise<void> {
  const months = parseInt(String(req.query.months || '6'), 10);
  const libId = req.user.role === 'super_admin' ? (req.query.libraryId as string) : req.libraryId;
  const data = await getMonthlyRevenueTrend(months, libId);
  successResponse(res, data, 'Revenue trend fetched');
}

export async function paymentMethodStats(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? (req.query.libraryId as string) : req.libraryId;
  const data = await getPaymentMethodStats(libId);
  successResponse(res, data, 'Payment method statistics fetched');
}

export async function expiringMembers(req: AuthRequest, res: Response): Promise<void> {
  const days = parseInt(String(req.query.days || '7'), 10);
  const libId = req.user.role === 'super_admin' ? (req.query.libraryId as string) : req.libraryId;
  const data = await getExpiringMembers(days, libId);
  successResponse(res, data, 'Expiring members fetched');
}

export async function occupancyReport(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? (req.query.libraryId as string) : req.libraryId;
  const data = await getOccupancyReport(libId);
  successResponse(res, data, 'Occupancy report fetched');
}
