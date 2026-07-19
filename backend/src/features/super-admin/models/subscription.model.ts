/**
 * Subscription Model — defines subscription plans available for libraries.
 *
 * Super admins can create, edit, and deactivate subscription plans.
 * Libraries are linked to a subscription plan when created.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubscription extends Document {
  name: string;             // e.g., "Basic", "Pro", "Enterprise"
  price: number;            // Monthly price in INR
  duration: number;         // Duration in days
  maxSeats: number;         // Maximum seats allowed
  maxStaff: number;         // Maximum staff members allowed
  features: string[];       // e.g., ['reports', 'multi-floor', 'payments']
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    name: {
      type: String,
      required: [true, 'Subscription name is required'],
      trim: true,
      unique: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 day'],
    },
    maxSeats: {
      type: Number,
      required: [true, 'Max seats is required'],
      min: [1, 'Max seats must be at least 1'],
    },
    maxStaff: {
      type: Number,
      required: [true, 'Max staff is required'],
      min: [1, 'Max staff must be at least 1'],
      default: 5,
    },
    features: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Subscription: Model<ISubscription> = mongoose.model<ISubscription>('Subscription', subscriptionSchema);
