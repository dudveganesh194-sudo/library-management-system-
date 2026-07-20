/**
 * Payment service — record fees, renewal tracking, and revenue aggregation (Multi-tenant scoped by libraryId).
 */

import mongoose from 'mongoose';
import { Payment, IPayment } from './payment.model';
import { Student } from '../students/student.model';
import { NotFoundError } from '../../middleware/error.middleware';
import { PaginatedResult, PaginationQuery } from '../../shared/types';
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '../../shared/constants';

const PLAN_DAYS: Record<string, number> = {
  monthly: 30,
  quarterly: 90,
  'half-yearly': 180,
  yearly: 365,
  '30': 30,
  '60': 60,
  '90': 90,
  '180': 180,
  '365': 365,
};

function computeEndDate(startDate: Date, plan: string): Date {
  const days = PLAN_DAYS[plan] || 30;
  const end = new Date(startDate);
  end.setDate(end.getDate() + days);
  return end;
}

export async function getAllPayments(
  query: PaginationQuery & { status?: string; method?: string; studentId?: string; collectedBy?: string; from?: string; to?: string; libraryId?: string }
): Promise<PaginatedResult<IPayment>> {
  const page = parseInt(query.page || String(DEFAULT_PAGE), 10);
  const limit = Math.min(parseInt(query.limit || String(DEFAULT_LIMIT), 10), 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (query.libraryId) filter.libraryId = query.libraryId;
  if (query.status) filter.status = query.status;
  if (query.method) filter.method = query.method;
  if (query.studentId) filter.student = query.studentId;
  if (query.collectedBy) filter.collectedBy = query.collectedBy;
  if (query.from || query.to) {
    filter.createdAt = {
      ...(query.from && { $gte: new Date(query.from) }),
      ...(query.to && { $lte: new Date(query.to) }),
    };
  }

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate('student', 'name studentId phone')
      .populate('seat', 'seatNumber')
      .populate('collectedBy', 'name role email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Payment.countDocuments(filter),
  ]);

  return { data: payments as any, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPaymentById(id: string, libraryId?: string): Promise<IPayment> {
  const filter: Record<string, unknown> = { _id: id };
  if (libraryId) filter.libraryId = libraryId;

  const payment = await Payment.findOne(filter)
    .populate('student', 'name studentId phone email address')
    .populate('seat', 'seatNumber floor section')
    .populate('collectedBy', 'name email')
    .lean();
  if (!payment) throw new NotFoundError('Payment');
  return payment as any;
}

export async function createPayment(
  data: Partial<IPayment>,
  collectedBy: string,
  libraryId?: string
): Promise<IPayment> {
  const studentFilter: Record<string, unknown> = { _id: data.student };
  if (libraryId) studentFilter.libraryId = libraryId;

  const student = await Student.findOne(studentFilter);
  if (!student) throw new NotFoundError('Student');

  let startDate = data.startDate ? new Date(data.startDate as any) : new Date();
  
  const paymentFilter: Record<string, unknown> = {
    student: student._id,
    status: 'paid',
    endDate: { $gt: new Date() },
  };
  if (libraryId) paymentFilter.libraryId = libraryId;

  const latestPayment = await Payment.findOne(paymentFilter).sort({ endDate: -1 });

  if (latestPayment) {
    startDate = new Date(latestPayment.endDate);
  }

  const endDate = data.endDate
    ? new Date(data.endDate as any)
    : computeEndDate(startDate, data.plan || 'monthly');

  const payment = new Payment({
    ...data,
    ...(libraryId && { libraryId }),
    startDate,
    endDate,
    collectedBy,
  });

  await payment.save();
  return payment.populate([
    { path: 'student', select: 'name studentId' },
    { path: 'collectedBy', select: 'name' },
  ]);
}

export async function updatePayment(id: string, data: Partial<IPayment>, libraryId?: string): Promise<IPayment> {
  const filter: Record<string, unknown> = { _id: id };
  if (libraryId) filter.libraryId = libraryId;

  const payment = await Payment.findOneAndUpdate(filter, data, {
    new: true,
    runValidators: true,
  });
  if (!payment) throw new NotFoundError('Payment');
  return payment;
}

export async function getRevenueStats(
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
  libraryId?: string
) {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'weekly':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default: // monthly
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const matchFilter: Record<string, unknown> = { status: 'paid', createdAt: { $gte: startDate } };
  if (libraryId) matchFilter.libraryId = new mongoose.Types.ObjectId(libraryId);

  const [total, byMethod, byPlan] = await Promise.all([
    Payment.aggregate([
      { $match: matchFilter },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$method', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$plan', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
  ]);

  return {
    period,
    total: total[0]?.total || 0,
    count: total[0]?.count || 0,
    byMethod,
    byPlan,
  };
}
