/**
 * Library Model — represents a study library managed by the platform.
 *
 * Each library has one owner (User with role 'owner'), an optional subscription plan,
 * a seats limit, payment status, subscription dates, and status (active/suspended/deleted).
 *
 * Created exclusively by super_admin users via the Super Admin Panel.
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { LIBRARY_STATUS, LibraryStatus, LIBRARY_PAYMENT_STATUS, LibraryPaymentStatus } from '../../../shared/constants';

export interface ILibrary extends Document {
  name: string;
  owner: Types.ObjectId;          // ref → User (owner)
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  subscription?: Types.ObjectId;  // ref → Subscription
  paymentStatus: LibraryPaymentStatus;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  seatsLimit: number;
  status: LibraryStatus;
  createdBy: Types.ObjectId;      // super_admin who created it
  createdAt: Date;
  updatedAt: Date;
}

const librarySchema = new Schema<ILibrary>(
  {
    name: {
      type: String,
      required: [true, 'Library name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Library must have an owner'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    pinCode: {
      type: String,
      required: [true, 'Pin code is required'],
      trim: true,
      match: [/^\d{6}$/, 'Pin code must be 6 digits'],
    },
    subscription: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(LIBRARY_PAYMENT_STATUS),
      default: LIBRARY_PAYMENT_STATUS.PAID,
    },
    subscriptionStartDate: {
      type: Date,
      default: Date.now,
    },
    subscriptionEndDate: {
      type: Date,
    },
    seatsLimit: {
      type: Number,
      required: [true, 'Seats limit is required'],
      min: [1, 'Seats limit must be at least 1'],
      max: [10000, 'Seats limit cannot exceed 10,000'],
    },
    status: {
      type: String,
      enum: Object.values(LIBRARY_STATUS),
      default: LIBRARY_STATUS.ACTIVE,
    },
    createdBy: {
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
librarySchema.index({ status: 1 });
librarySchema.index({ paymentStatus: 1 });
librarySchema.index({ subscriptionEndDate: 1 });
librarySchema.index({ owner: 1 });
librarySchema.index({ name: 'text', email: 'text', city: 'text' });

export const Library: Model<ILibrary> = mongoose.model<ILibrary>('Library', librarySchema);
