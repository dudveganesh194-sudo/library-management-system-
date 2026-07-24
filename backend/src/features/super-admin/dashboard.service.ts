/**
 * Dashboard Service — aggregates platform-wide statistics for the Super Admin dashboard.
 */

import { Library } from './models/library.model';
import { Subscription } from './models/subscription.model';
import { User } from '../users/user.model';
import { Student } from '../students/student.model';
import { LibraryPayment } from './models/library-payment.model';
import { AuditLog } from './models/audit-log.model';
import { LIBRARY_STATUS, LIBRARY_PAYMENT_STATUS, ROLES } from '../../shared/constants';

export interface DashboardStats {
  libraries: {
    total: number;
    active: number;
    suspended: number;
    left: number;
    deleted: number;
    paid: number;
    unpaid: number;
    trial: number;
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
    paymentStatus: string;
    subscriptionEndDate?: Date;
    subscriptionName?: string;
    status: string;
  }>;
  recentActivity: Array<{
    _id: string;
    action: string;
    details: string;
    createdAt: Date;
    performedBy: { name: string; email: string } | null;
  }>;
}

/**
 * Fetches all platform-wide statistics in parallel for maximum performance.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    totalLibraries,
    activeLibraries,
    suspendedLibraries,
    leftLibraries,
    deletedLibraries,
    paidLibraries,
    unpaidLibraries,
    trialLibraries,
    expiringSoonLibraries,
    expiredLibraries,
    attentionLibrariesDocs,
    totalSubscriptions,
    activeSubscriptions,
    totalOwners,
    totalStaff,
    totalStudents,
    activeStudents,
    totalRevenueResult,
    thisMonthRevenueResult,
    lastMonthRevenueResult,
    recentActivity,
  ] = await Promise.all([
    Library.countDocuments(),
    Library.countDocuments({ status: LIBRARY_STATUS.ACTIVE }),
    Library.countDocuments({ status: LIBRARY_STATUS.SUSPENDED }),
    Library.countDocuments({ status: LIBRARY_STATUS.LEFT }),
    Library.countDocuments({ status: LIBRARY_STATUS.DELETED }),
    Library.countDocuments({ paymentStatus: LIBRARY_PAYMENT_STATUS.PAID, status: { $ne: LIBRARY_STATUS.DELETED } }),
    Library.countDocuments({ paymentStatus: { $in: [LIBRARY_PAYMENT_STATUS.UNPAID, LIBRARY_PAYMENT_STATUS.PENDING] }, status: { $ne: LIBRARY_STATUS.DELETED } }),
    Library.countDocuments({ $or: [{ paymentStatus: LIBRARY_PAYMENT_STATUS.TRIAL }, { isTrial: true }], status: { $ne: LIBRARY_STATUS.DELETED } }),
    Library.countDocuments({ subscriptionEndDate: { $gte: now, $lte: sevenDaysFromNow }, status: { $ne: LIBRARY_STATUS.DELETED } }),
    Library.countDocuments({ subscriptionEndDate: { $lt: now }, status: { $ne: LIBRARY_STATUS.DELETED } }),
    Library.find({
      status: { $ne: LIBRARY_STATUS.DELETED },
      $or: [
        { paymentStatus: { $in: [LIBRARY_PAYMENT_STATUS.UNPAID, LIBRARY_PAYMENT_STATUS.PENDING] } },
        { subscriptionEndDate: { $lte: sevenDaysFromNow } },
      ],
    })
      .populate('subscription', 'name')
      .limit(5)
      .lean(),
    Subscription.countDocuments(),
    Subscription.countDocuments({ isActive: true }),
    User.countDocuments({ role: ROLES.OWNER }),
    User.countDocuments({ role: { $in: [ROLES.MANAGER, ROLES.RECEPTIONIST] } }),
    Student.countDocuments(),
    Student.countDocuments({ status: 'active' }),

    // ── ERP Subscription Revenue Aggregations (from LibraryPayment collection) ──
    LibraryPayment.aggregate([
      { $match: { status: LIBRARY_PAYMENT_STATUS.PAID } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    LibraryPayment.aggregate([
      { $match: { status: LIBRARY_PAYMENT_STATUS.PAID, paymentDate: { $gte: thisMonthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    LibraryPayment.aggregate([
      { $match: { status: LIBRARY_PAYMENT_STATUS.PAID, paymentDate: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    AuditLog.find()
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  const totalRevenue = totalRevenueResult[0]?.total || 0;
  const thisMonthRevenue = thisMonthRevenueResult[0]?.total || 0;
  const lastMonthRevenue = lastMonthRevenueResult[0]?.total || 0;
  const growthPercentage = lastMonthRevenue > 0
    ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : thisMonthRevenue > 0 ? 100 : 0;

  return {
    libraries: {
      total: totalLibraries,
      active: activeLibraries,
      suspended: suspendedLibraries,
      left: leftLibraries,
      deleted: deletedLibraries,
      paid: paidLibraries,
      unpaid: unpaidLibraries,
      trial: trialLibraries,
      expiringSoon: expiringSoonLibraries,
      expired: expiredLibraries,
    },
    subscriptions: {
      total: totalSubscriptions,
      active: activeSubscriptions,
    },
    users: {
      totalOwners: totalOwners,
      totalStaff: totalStaff,
    },
    students: {
      total: totalStudents,
      activeTotal: activeStudents,
    },
    revenue: {
      totalAllTime: totalRevenue,
      thisMonth: thisMonthRevenue,
      lastMonth: lastMonthRevenue,
      growthPercentage,
    },
    attentionLibraries: attentionLibrariesDocs.map((lib: any) => ({
      _id: String(lib._id),
      name: lib.name,
      email: lib.email,
      phone: lib.phone,
      paymentStatus: lib.paymentStatus,
      subscriptionEndDate: lib.subscriptionEndDate,
      subscriptionName: lib.subscription?.name || 'Custom',
      status: lib.status,
    })),
    recentActivity: recentActivity.map((log) => ({
      _id: String(log._id),
      action: log.action,
      details: log.details,
      createdAt: log.createdAt,
      performedBy: log.performedBy as unknown as { name: string; email: string } | null,
    })),
  };
}

// ── Revenue Analytics ────────────────────────────────────────────────────────

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

/**
 * Aggregates ERP subscription revenue from libraries for the Super Admin Revenue page.
 */
export async function getRevenueData(): Promise<RevenueData> {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const [totalRevenueResult, monthlyRevenue, librariesWithRevenue] = await Promise.all([
    // Total ERP subscription revenue
    LibraryPayment.aggregate([
      { $match: { status: LIBRARY_PAYMENT_STATUS.PAID } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    // Monthly ERP subscription revenue breakdown
    LibraryPayment.aggregate([
      { $match: { status: LIBRARY_PAYMENT_STATUS.PAID, paymentDate: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' },
          },
          revenue: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    // Revenue breakdown per library
    Library.find({ status: { $ne: LIBRARY_STATUS.DELETED } })
      .populate('subscription', 'name price')
      .lean(),
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedMonthly = monthlyRevenue.map((m) => ({
    month: `${monthNames[m._id.month - 1]} ${m._id.year}`,
    revenue: m.revenue,
  }));

  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const revenueByLibrary = await Promise.all(
    librariesWithRevenue.map(async (lib: any) => {
      const [libTotalResult, libThisMonthResult] = await Promise.all([
        LibraryPayment.aggregate([
          { $match: { library: lib._id, status: LIBRARY_PAYMENT_STATUS.PAID } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        LibraryPayment.aggregate([
          { $match: { library: lib._id, status: LIBRARY_PAYMENT_STATUS.PAID, paymentDate: { $gte: thisMonthStart } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
      ]);

      return {
        libraryId: String(lib._id),
        libraryName: lib.name,
        planName: lib.subscription?.name || 'Custom',
        paymentStatus: lib.paymentStatus || 'paid',
        totalRevenue: libTotalResult[0]?.total || 0,
        thisMonthRevenue: libThisMonthResult[0]?.total || 0,
      };
    })
  );

  return {
    totalRevenue: totalRevenueResult[0]?.total || 0,
    monthlyRevenue: formattedMonthly,
    revenueByLibrary,
  };
}
