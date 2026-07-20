/**
 * Reports service — aggregated data for dashboard and reports pages (Multi-tenant scoped by libraryId).
 */

import mongoose from 'mongoose';
import { Student } from '../students/student.model';
import { Seat } from '../seats/seat.model';
import { Payment } from '../payments/payment.model';
import { memoryCache } from '../../shared/helpers/cache.helper';

export async function getDashboardStats(libraryId?: string) {
  const cacheKey = `reports:dashboard:${libraryId || 'all'}`;
  const cached = memoryCache.get<any>(cacheKey);
  if (cached) return cached;
  const now = new Date();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const filterObj = libraryId ? { libraryId: new mongoose.Types.ObjectId(libraryId) } : {};
  const filterRaw = libraryId ? { libraryId } : {};

  const [
    totalStudents,
    activeStudents,
    seatStats,
    monthlyRevenue,
    recentPayments,
    expiringSoon,
    newStudentsThisMonth,
    todaysAdmissions,
    todaysRenewals,
    dailyRevenueResult,
  ] = await Promise.all([
    Student.countDocuments(filterRaw),
    Student.countDocuments({ ...filterRaw, status: 'active' }),
    Seat.aggregate([
      ...(libraryId ? [{ $match: filterObj }] : []),
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { ...filterObj, status: 'paid', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Payment.find({ ...filterRaw, status: 'paid' })
      .populate('student', 'name studentId')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Payment.find({
      ...filterRaw,
      endDate: { $gte: now, $lte: sevenDaysFromNow },
      status: 'paid',
    })
      .populate('student', 'name studentId phone')
      .sort({ endDate: 1 })
      .limit(10)
      .lean(),
    Student.countDocuments({ ...filterRaw, createdAt: { $gte: startOfMonth } }),
    Student.countDocuments({ ...filterRaw, createdAt: { $gte: startOfToday, $lte: endOfToday } }),
    Payment.countDocuments({
      ...filterRaw,
      status: 'paid',
      type: 'renewal',
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    }),
    Payment.aggregate([
      { $match: { ...filterObj, status: 'paid', createdAt: { $gte: startOfToday, $lte: endOfToday } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const seatMap: Record<string, number> = {};
  let totalSeats = 0;
  seatStats.forEach((s: any) => {
    seatMap[s._id] = s.count;
    totalSeats += s.count;
  });

  const result = {
    students: {
      total: totalStudents,
      active: activeStudents,
      newThisMonth: newStudentsThisMonth,
      todaysAdmissions,
    },
    seats: {
      total: totalSeats,
      available: seatMap.available || 0,
      occupied: seatMap.occupied || 0,
      maintenance: seatMap.maintenance || 0,
      occupancyRate: totalSeats ? Math.round(((seatMap.occupied || 0) / totalSeats) * 100) : 0,
    },
    revenue: {
      today: dailyRevenueResult[0]?.total || 0,
      thisMonth: monthlyRevenue[0]?.total || 0,
    },
    renewals: {
      today: todaysRenewals,
    },
    recentPayments,
    expiringSoon,
  };

  memoryCache.set(cacheKey, result, 30);
  return result;
}

export async function getMonthlyRevenueTrend(months = 6, libraryId?: string) {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const filterObj = libraryId ? { libraryId: new mongoose.Types.ObjectId(libraryId) } : {};

  const aggregatedResults = await Payment.aggregate([
    {
      $match: {
        ...filterObj,
        status: 'paid',
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          method: { $toLower: '$method' },
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const resultMap = new Map<string, { total: number; cash: number; upi: number; card: number; count: number }>();

  aggregatedResults.forEach((r: any) => {
    const key = `${r._id.year}-${r._id.month}`;
    if (!resultMap.has(key)) {
      resultMap.set(key, { total: 0, cash: 0, upi: 0, card: 0, count: 0 });
    }
    const entry = resultMap.get(key)!;
    entry.total += r.total;
    entry.count += r.count;
    if (r._id.method === 'cash') entry.cash += r.total;
    else if (r._id.method === 'upi') entry.upi += r.total;
    else if (r._id.method === 'card') entry.card += r.total;
  });

  const results = [];
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const entry = resultMap.get(key) || { total: 0, cash: 0, upi: 0, card: 0, count: 0 };

    results.push({
      month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
      revenue: entry.total,
      cash: entry.cash,
      upi: entry.upi,
      card: entry.card,
      transactions: entry.count,
    });
  }

  return results;
}

export async function getStaffCollectionStats(libraryId?: string) {
  const filterObj = libraryId ? { libraryId: new mongoose.Types.ObjectId(libraryId) } : {};

  const [paymentStats, studentStats] = await Promise.all([
    Payment.aggregate([
      { $match: { ...filterObj, status: 'paid' } },
      {
        $group: {
          _id: '$collectedBy',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    Student.aggregate([
      { $match: filterObj },
      {
        $group: {
          _id: '$createdBy',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const userIds = [
    ...new Set([
      ...paymentStats.map((p) => p._id?.toString()).filter(Boolean),
      ...studentStats.map((s) => s._id?.toString()).filter(Boolean),
    ]),
  ];

  const User = mongoose.model('User');
  const users = await User.find({ _id: { $in: userIds } }).select('name role email').lean();
  const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

  const studentCountMap: Record<string, number> = {};
  studentStats.forEach((s) => {
    if (s._id) studentCountMap[s._id.toString()] = s.count;
  });

  return paymentStats.map((p) => {
    const userIdStr = p._id?.toString();
    const userInfo = userMap.get(userIdStr);
    return {
      userId: userIdStr,
      userName: userInfo?.name || 'Unknown Staff',
      role: userInfo?.role || 'staff',
      email: userInfo?.email || '',
      collectedAmount: p.totalAmount,
      paymentsCount: p.count,
      studentsAdded: studentCountMap[userIdStr] || 0,
    };
  });
}

export async function getPaymentSummaryStats(libraryId?: string) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();
  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  const startOfMonth = new Date(currentYear, currentMonthIdx, 1);
  const endOfMonth = new Date(currentYear, currentMonthIdx + 1, 0, 23, 59, 59, 999);

  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

  const filterObj = libraryId ? { libraryId: new mongoose.Types.ObjectId(libraryId) } : {};

  const [monthStats, yearStats, allTimeStats, staffBreakdown] = await Promise.all([
    Payment.aggregate([
      { $match: { ...filterObj, status: 'paid', createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: '$method', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { ...filterObj, status: 'paid', createdAt: { $gte: startOfYear, $lte: endOfYear } } },
      { $group: { _id: '$method', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { ...filterObj, status: 'paid' } },
      { $group: { _id: '$method', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    getStaffCollectionStats(libraryId),
  ]);

  function parseBreakdown(raw: any[]) {
    let totalRevenue = 0;
    let totalTxns = 0;
    const methods: Record<string, { totalAmount: number; count: number }> = {
      cash: { totalAmount: 0, count: 0 },
      upi: { totalAmount: 0, count: 0 },
      card: { totalAmount: 0, count: 0 },
    };

    raw.forEach((item) => {
      const m = (item._id || 'cash').toLowerCase();
      totalRevenue += item.totalAmount;
      totalTxns += item.count;
      methods[m] = {
        totalAmount: item.totalAmount,
        count: item.count,
      };
    });

    const cashPercent = totalRevenue ? Math.round((methods.cash.totalAmount / totalRevenue) * 100) : 0;
    const upiPercent = totalRevenue ? Math.round((methods.upi.totalAmount / totalRevenue) * 100) : 0;
    const cardPercent = totalRevenue ? Math.round((methods.card.totalAmount / totalRevenue) * 100) : 0;

    return {
      totalRevenue,
      totalTxns,
      methods,
      cashPercent,
      upiPercent,
      cardPercent,
      breakdown: [
        { key: 'cash', label: 'Cash', totalAmount: methods.cash.totalAmount, count: methods.cash.count, percentage: cashPercent },
        { key: 'upi', label: 'UPI', totalAmount: methods.upi.totalAmount, count: methods.upi.count, percentage: upiPercent },
        { key: 'card', label: 'Card', totalAmount: methods.card.totalAmount, count: methods.card.count, percentage: cardPercent },
      ],
    };
  }

  return {
    month: {
      name: monthName,
      year: currentYear,
      ...parseBreakdown(monthStats),
    },
    year: {
      year: currentYear,
      name: `Overall ${currentYear}`,
      ...parseBreakdown(yearStats),
    },
    allTime: {
      name: 'All Time',
      ...parseBreakdown(allTimeStats),
    },
    staffBreakdown,
  };
}

export async function getPaymentMethodStats(libraryId?: string) {
  const summary = await getPaymentSummaryStats(libraryId);
  return {
    totalRevenue: summary.allTime.totalRevenue,
    methods: summary.allTime.methods,
    breakdown: summary.allTime.breakdown,
    summary,
  };
}

export async function getExpiringMembers(days = 7, libraryId?: string) {
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const filterRaw: Record<string, unknown> = {
    endDate: { $lte: future },
  };
  if (libraryId) filterRaw.libraryId = libraryId;

  return Payment.find(filterRaw)
    .populate('student', 'name studentId phone plan status')
    .populate('seat', 'seatNumber')
    .sort({ endDate: 1 })
    .lean();
}

export async function getOccupancyReport(libraryId?: string) {
  const filterRaw: Record<string, unknown> = {};
  if (libraryId) filterRaw.libraryId = libraryId;

  return Seat.find(filterRaw)
    .populate('currentStudent', 'name studentId plan')
    .sort({ floor: 1, seatNumber: 1 })
    .lean();
}
