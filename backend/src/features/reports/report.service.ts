/**
 * Reports service — aggregated data for dashboard and reports pages (Multi-tenant scoped by libraryId).
 */

import mongoose from 'mongoose';
import { Student } from '../students/student.model';
import { Seat } from '../seats/seat.model';
import { Payment } from '../payments/payment.model';

export async function getDashboardStats(libraryId?: string) {
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
      .limit(5),
    Payment.find({
      ...filterRaw,
      endDate: { $gte: now, $lte: sevenDaysFromNow },
      status: 'paid',
    })
      .populate('student', 'name studentId phone')
      .sort({ endDate: 1 })
      .limit(10),
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

  return {
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
}

export async function getMonthlyRevenueTrend(months = 6, libraryId?: string) {
  const results = [];
  const now = new Date();
  const filterObj = libraryId ? { libraryId: new mongoose.Types.ObjectId(libraryId) } : {};

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

    const result = await Payment.aggregate([
      { $match: { ...filterObj, status: 'paid', createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$method',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    let total = 0;
    let cash = 0;
    let upi = 0;
    let card = 0;
    let count = 0;

    result.forEach((r: any) => {
      total += r.total;
      count += r.count;
      const m = (r._id || '').toLowerCase();
      if (m === 'cash') cash = r.total;
      else if (m === 'upi') upi = r.total;
      else if (m === 'card') card = r.total;
    });

    results.push({
      month: start.toLocaleString('default', { month: 'short', year: 'numeric' }),
      revenue: total,
      cash,
      upi,
      card,
      transactions: count,
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
  const users = await User.find({ _id: { $in: userIds } }).select('name role email');
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
    .sort({ endDate: 1 });
}

export async function getOccupancyReport(libraryId?: string) {
  const filterRaw: Record<string, unknown> = {};
  if (libraryId) filterRaw.libraryId = libraryId;

  return Seat.find(filterRaw)
    .populate('currentStudent', 'name studentId plan')
    .sort({ floor: 1, seatNumber: 1 });
}
