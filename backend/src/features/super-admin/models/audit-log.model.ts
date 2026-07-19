/**
 * Audit Log Model — records all administrative actions for accountability.
 *
 * Every super_admin action (create library, suspend, delete, etc.) is logged here.
 * Logs are immutable — they are only created, never updated or deleted.
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;           // e.g., 'library.created', 'library.suspended', 'subscription.updated'
  performedBy: Types.ObjectId; // super_admin user who performed the action
  targetType: string;       // 'library' | 'subscription' | 'user' | 'settings'
  targetId?: Types.ObjectId; // ID of the affected document
  details: string;          // Human-readable description of the action
  metadata?: Record<string, unknown>; // Additional context (old values, new values, etc.)
  ipAddress?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
      index: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Performed by is required'],
    },
    targetType: {
      type: String,
      required: [true, 'Target type is required'],
      enum: ['library', 'subscription', 'user', 'settings'],
    },
    targetId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    details: {
      type: String,
      required: [true, 'Details are required'],
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: { type: String, trim: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Logs are immutable
    versionKey: false,
  }
);

// ── Indexes ─────────────────────────────────────────────────────────────────
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });

export const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
