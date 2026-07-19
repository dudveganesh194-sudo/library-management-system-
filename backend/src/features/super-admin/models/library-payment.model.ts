/**
 * Library Payment Model — records subscription payments collected by Super Admin from libraries.
 *
 * Used to track ERP subscription revenue (e.g., ₹1000/month per library).
 * This is separate from student fee payments collected by library owners.
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { LIBRARY_PAYMENT_STATUS, LibraryPaymentStatus } from '../../../shared/constants';

export interface ILibraryPayment extends Document {
  library: Types.ObjectId;          // ref → Library
  subscription?: Types.ObjectId;   // ref → Subscription plan
  amount: number;                  // ERP charge amount (e.g. ₹1000)
  paymentDate: Date;               // Date payment received
  periodStartDate: Date;          // Plan start date
  periodEndDate: Date;            // Plan end date
  paymentMethod: 'cash' | 'upi' | 'bank_transfer' | 'card' | 'other';
  status: LibraryPaymentStatus;    // paid | unpaid | pending
  invoiceNumber: string;
  notes?: string;
  recordedBy: Types.ObjectId;      // super_admin user
  createdAt: Date;
  updatedAt: Date;
}

const libraryPaymentSchema = new Schema<ILibraryPayment>(
  {
    library: {
      type: Schema.Types.ObjectId,
      ref: 'Library',
      required: [true, 'Library is required'],
    },
    subscription: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    periodStartDate: {
      type: Date,
      default: Date.now,
    },
    periodEndDate: {
      type: Date,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'bank_transfer', 'card', 'other'],
      default: 'upi',
    },
    status: {
      type: String,
      enum: Object.values(LIBRARY_PAYMENT_STATUS),
      default: LIBRARY_PAYMENT_STATUS.PAID,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    notes: { type: String, trim: true },
    recordedBy: {
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

// Indexes
libraryPaymentSchema.index({ library: 1, paymentDate: -1 });
libraryPaymentSchema.index({ status: 1, paymentDate: -1 });

export const LibraryPayment: Model<ILibraryPayment> = mongoose.model<ILibraryPayment>('LibraryPayment', libraryPaymentSchema);
