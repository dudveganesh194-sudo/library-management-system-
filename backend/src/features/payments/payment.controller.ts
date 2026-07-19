import { Response } from 'express';
import { AuthRequest } from '../../shared/types';
import { successResponse, createdResponse, paginationMeta } from '../../shared/helpers/api-response';
import { getAllPayments, getPaymentById, createPayment, updatePayment, getRevenueStats } from './payment.service';

export async function listPayments(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? (req.query.libraryId as string) : req.libraryId;
  const result = await getAllPayments({ ...req.query, libraryId: libId } as any);
  successResponse(res, result.data, 'Payments fetched', 200, paginationMeta(result.total, result.page, result.limit));
}

export async function getPayment(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? undefined : req.libraryId;
  const payment = await getPaymentById(req.params.id, libId);
  successResponse(res, payment);
}

export async function addPayment(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? (req.body.libraryId || req.libraryId) : req.libraryId;
  const payment = await createPayment(req.body, req.user.id, libId);
  createdResponse(res, payment, 'Payment recorded successfully');
}

export async function editPayment(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? undefined : req.libraryId;
  const payment = await updatePayment(req.params.id, req.body, libId);
  successResponse(res, payment, 'Payment updated successfully');
}

export async function revenueStats(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? (req.query.libraryId as string) : req.libraryId;
  const stats = await getRevenueStats(req.query.period as any, libId);
  successResponse(res, stats, 'Revenue statistics fetched');
}
