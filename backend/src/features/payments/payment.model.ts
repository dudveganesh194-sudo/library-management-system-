/**
 * Payment Model — records all fee transactions (Multi-tenant scoped by libraryId).
 *
 * Auto-generates a receipt number on creation.
 * Tracks plan period (startDate → endDate) for renewal tracking.
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import {
  PAYMENT_METHOD,
  PaymentMethod,
  PAYMENT_TYPE,
  PaymentType,
  PAYMENT_STATUS,
  PaymentStatus,
  PLAN_TYPE,
  PlanType,
} from '../../shared/constants';
import { generateReceiptNumber } from '../../shared/helpers/generate-id';

export interface IPayment extends Document {
  libraryId?: Types.ObjectId; // Multi-tenant library scope
  receiptNumber: string;
  student: Types.ObjectId;
  seat?: Types.ObjectId;
  amount: number;
  method: PaymentMethod;
  type: PaymentType;
  plan: PlanType;
  startDate: Date;
  endDate: Date;
  status: PaymentStatus;
  notes?: string;
  collectedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    libraryId: {
      type: Schema.Types.ObjectId,
      ref: 'Library',
    },
    receiptNumber: {
      type: String,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    seat: {
      type: Schema.Types.ObjectId,
      ref: 'Seat',
      default: null,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    method: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      required: [true, 'Payment method is required'],
    },
    type: {
      type: String,
      enum: Object.values(PAYMENT_TYPE),
      default: PAYMENT_TYPE.NEW,
    },
    plan: {
      type: String,
      enum: Object.values(PLAN_TYPE),
      required: [true, 'Plan is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PAID,
    },
    notes: { type: String, trim: true },
    collectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes ─────────────────────────────────────────────────────────────────
paymentSchema.index({ libraryId: 1, receiptNumber: 1 }, { unique: true, sparse: true });
paymentSchema.index({ libraryId: 1, student: 1 });
paymentSchema.index({ libraryId: 1, status: 1 });
paymentSchema.index({ libraryId: 1, createdAt: -1 });
paymentSchema.index({ libraryId: 1, endDate: 1 }); // For expiry queries
paymentSchema.index({ libraryId: 1, status: 1, createdAt: -1 });
paymentSchema.index({ libraryId: 1, status: 1, endDate: 1 });
paymentSchema.index({ libraryId: 1, collectedBy: 1, status: 1 });
paymentSchema.index({ libraryId: 1, method: 1, status: 1 });

// ── Pre-save: generate receipt number ────────────────────────────────────────
paymentSchema.pre('save', function (next) {
  if (this.isNew && !this.receiptNumber) {
    this.receiptNumber = generateReceiptNumber();
  }
  next();
});

export const Payment: Model<IPayment> = mongoose.model<IPayment>('Payment', paymentSchema);
