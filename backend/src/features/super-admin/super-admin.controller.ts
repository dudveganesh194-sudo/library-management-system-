/**
 * Super Admin Controller — handles HTTP layer for all super admin operations.
 *
 * All handlers expect req.user to be a super_admin (enforced by route middleware).
 */

import { Response } from 'express';
import { AuthRequest } from '../../shared/types';
import { successResponse, createdResponse, paginationMeta } from '../../shared/helpers/api-response';
import { NotFoundError, AppError } from '../../middleware/error.middleware';
import { User } from '../users/user.model';

// Services
import * as libraryService from './library.service';
import * as subscriptionService from './subscription.service';
import * as dashboardService from './dashboard.service';
import * as auditLogService from './audit-log.service';

// ── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboard(req: AuthRequest, res: Response): Promise<void> {
  const stats = await dashboardService.getDashboardStats();
  successResponse(res, stats, 'Dashboard data loaded');
}

// ── Libraries ────────────────────────────────────────────────────────────────

export async function getLibraries(req: AuthRequest, res: Response): Promise<void> {
  const result = await libraryService.getAllLibraries(req.query as any);
  successResponse(
    res,
    result.data,
    'Libraries fetched',
    200,
    paginationMeta(result.total, result.page, result.limit)
  );
}

export async function getLibraryById(req: AuthRequest, res: Response): Promise<void> {
  const library = await libraryService.getLibraryById(req.params.id);
  successResponse(res, library);
}

export async function createLibrary(req: AuthRequest, res: Response): Promise<void> {
  const ipAddress = req.ip || req.socket.remoteAddress;
  const result = await libraryService.createLibrary(req.body, req.user.id, ipAddress);
  createdResponse(res, result, 'Library created successfully');
}

export async function updateLibrary(req: AuthRequest, res: Response): Promise<void> {
  const ipAddress = req.ip || req.socket.remoteAddress;
  const library = await libraryService.updateLibrary(
    req.params.id,
    req.body,
    req.user.id,
    ipAddress
  );
  successResponse(res, library, 'Library updated successfully');
}

export async function suspendLibrary(req: AuthRequest, res: Response): Promise<void> {
  const ipAddress = req.ip || req.socket.remoteAddress;
  const library = await libraryService.suspendLibrary(req.params.id, req.user.id, ipAddress);
  successResponse(res, library, 'Library suspended');
}

export async function activateLibrary(req: AuthRequest, res: Response): Promise<void> {
  const ipAddress = req.ip || req.socket.remoteAddress;
  const library = await libraryService.activateLibrary(req.params.id, req.user.id, ipAddress);
  successResponse(res, library, 'Library activated');
}

export async function deleteLibrary(req: AuthRequest, res: Response): Promise<void> {
  const ipAddress = req.ip || req.socket.remoteAddress;
  await libraryService.deleteLibrary(req.params.id, req.user.id, ipAddress);
  successResponse(res, null, 'Library deleted');
}

// ── Subscriptions ────────────────────────────────────────────────────────────

export async function getSubscriptions(req: AuthRequest, res: Response): Promise<void> {
  const subscriptions = await subscriptionService.getAllSubscriptions();
  successResponse(res, subscriptions, 'Subscriptions fetched');
}

export async function createSubscription(req: AuthRequest, res: Response): Promise<void> {
  const subscription = await subscriptionService.createSubscription(req.body);

  // Audit log
  await auditLogService.logAction({
    action: 'subscription.created',
    performedBy: req.user.id,
    targetType: 'subscription',
    targetId: String(subscription._id),
    details: `Created subscription plan "${subscription.name}" at ₹${subscription.price}`,
    ipAddress: req.ip || req.socket.remoteAddress,
  });

  createdResponse(res, subscription, 'Subscription created');
}

export async function updateSubscription(req: AuthRequest, res: Response): Promise<void> {
  const subscription = await subscriptionService.updateSubscription(req.params.id, req.body);

  await auditLogService.logAction({
    action: 'subscription.updated',
    performedBy: req.user.id,
    targetType: 'subscription',
    targetId: req.params.id,
    details: `Updated subscription plan "${subscription.name}"`,
    metadata: { changes: req.body },
    ipAddress: req.ip || req.socket.remoteAddress,
  });

  successResponse(res, subscription, 'Subscription updated');
}

export async function deleteSubscription(req: AuthRequest, res: Response): Promise<void> {
  const subscription = await subscriptionService.getSubscriptionById(req.params.id);

  await subscriptionService.deleteSubscription(req.params.id);

  await auditLogService.logAction({
    action: 'subscription.deleted',
    performedBy: req.user.id,
    targetType: 'subscription',
    targetId: req.params.id,
    details: `Deleted subscription plan "${subscription.name}"`,
    ipAddress: req.ip || req.socket.remoteAddress,
  });

  successResponse(res, null, 'Subscription deleted');
}

export async function getSubscriptionStats(req: AuthRequest, res: Response): Promise<void> {
  const stats = await subscriptionService.getSubscriptionStats();
  successResponse(res, stats);
}

// ── Revenue ──────────────────────────────────────────────────────────────────

export async function getRevenue(req: AuthRequest, res: Response): Promise<void> {
  const data = await dashboardService.getRevenueData();
  successResponse(res, data, 'Revenue data loaded');
}

// ── Audit Logs ───────────────────────────────────────────────────────────────

export async function getLogs(req: AuthRequest, res: Response): Promise<void> {
  const result = await auditLogService.getLogs(req.query as any);
  successResponse(
    res,
    result.data,
    'Logs fetched',
    200,
    paginationMeta(result.total, result.page, result.limit)
  );
}

// ── Profile ──────────────────────────────────────────────────────────────────

export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  const user = await User.findById(req.user.id);
  if (!user) throw new NotFoundError('User');
  successResponse(res, user.toSafeObject(), 'Profile loaded');
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  const allowedFields = ['name', 'email', 'phone'];
  const update: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      update[field] = req.body[field];
    }
  }

  const user = await User.findByIdAndUpdate(req.user.id, update, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new NotFoundError('User');
  successResponse(res, user.toSafeObject(), 'Profile updated');
}

export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');
  if (!user) throw new NotFoundError('User');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 400);
  }

  user.password = newPassword;
  user.refreshTokens = []; // Invalidate all sessions
  await user.save();

  await auditLogService.logAction({
    action: 'profile.password_changed',
    performedBy: req.user.id,
    targetType: 'user',
    targetId: req.user.id,
    details: 'Super admin changed their password',
    ipAddress: req.ip || req.socket.remoteAddress,
  });

  successResponse(res, null, 'Password changed successfully');
}

export async function resetUserPassword(req: AuthRequest, res: Response): Promise<void> {
  const { userId } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    throw new AppError('Password must be at least 8 characters long', 400);
  }

  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User');

  user.password = newPassword;
  user.refreshTokens = []; // Revoke active sessions for security
  await user.save();

  await auditLogService.logAction({
    action: 'user.password_reset_by_super_admin',
    performedBy: req.user.id,
    targetType: 'user',
    targetId: String(user._id),
    details: `Super Admin reset password for user "${user.name}" (${user.email})`,
    ipAddress: req.ip || req.socket.remoteAddress,
  });

  successResponse(res, null, `Password for ${user.email} updated successfully`);
}

export async function resetLibraryOwnerPassword(req: AuthRequest, res: Response): Promise<void> {
  const { id: libraryId } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    throw new AppError('Password must be at least 8 characters long', 400);
  }

  const { Library } = await import('./models/library.model');
  const library = await Library.findById(libraryId);
  if (!library) throw new NotFoundError('Library');

  const owner = await User.findById(library.owner);
  if (!owner) throw new NotFoundError('Library Owner Account');

  owner.password = newPassword;
  owner.refreshTokens = []; // Revoke active sessions for security
  await owner.save();

  await auditLogService.logAction({
    action: 'library_owner.password_reset_by_super_admin',
    performedBy: req.user.id,
    targetType: 'library',
    targetId: libraryId,
    details: `Super Admin reset owner password for library "${library.name}" (${owner.email})`,
    ipAddress: req.ip || req.socket.remoteAddress,
  });

  successResponse(res, null, `Password for library owner (${owner.email}) updated successfully`);
}
