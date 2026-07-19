/**
 * Audit Log Service — creates and queries immutable audit log entries.
 *
 * Every super_admin action is logged here for accountability and compliance.
 */

import mongoose from 'mongoose';
import { AuditLog, IAuditLog } from './models/audit-log.model';
import { PaginatedResult } from '../../shared/types';
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '../../shared/constants';

interface LogActionParams {
  action: string;
  performedBy: string;
  targetType: 'library' | 'subscription' | 'user' | 'settings';
  targetId?: string;
  details: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Creates an immutable audit log entry.
 * Called from other services after successful operations.
 */
export async function logAction(params: LogActionParams): Promise<IAuditLog> {
  const log = new AuditLog({
    action: params.action,
    performedBy: new mongoose.Types.ObjectId(params.performedBy),
    targetType: params.targetType,
    targetId: params.targetId ? new mongoose.Types.ObjectId(params.targetId) : null,
    details: params.details,
    metadata: params.metadata || {},
    ipAddress: params.ipAddress,
  });
  await log.save();
  return log;
}

interface LogQuery {
  page?: string;
  limit?: string;
  search?: string;
  action?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Retrieves paginated audit logs with optional filters.
 */
export async function getLogs(query: LogQuery): Promise<PaginatedResult<IAuditLog>> {
  const page = parseInt(query.page || String(DEFAULT_PAGE), 10);
  const limit = Math.min(parseInt(query.limit || String(DEFAULT_LIMIT), 10), 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  // Filter by action type (e.g., 'library.created')
  if (query.action) {
    filter.action = { $regex: query.action, $options: 'i' };
  }

  // Filter by target type
  if (query.targetType) {
    filter.targetType = query.targetType;
  }

  // Filter by date range
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) {
      (filter.createdAt as Record<string, Date>).$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      (filter.createdAt as Record<string, Date>).$lte = new Date(query.endDate);
    }
  }

  // Search in details text
  if (query.search) {
    filter.details = { $regex: query.search, $options: 'i' };
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(filter),
  ]);

  return {
    data: logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
