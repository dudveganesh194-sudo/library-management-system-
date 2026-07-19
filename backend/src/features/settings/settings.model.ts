/**
 * Settings Model — library-wide configuration (Multi-tenant scoped by libraryId).
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPlanConfig {
  name: string; // e.g., "Monthly"
  type: string; // matches PlanType
  durationDays: number;
  price: number;
  isActive: boolean;
}

export interface IWorkingHours {
  open: string; // e.g., "06:00"
  close: string; // e.g., "22:00"
  daysOpen: string[]; // e.g., ['Monday', ..., 'Sunday']
}

export interface ISettings extends Document {
  libraryId?: Types.ObjectId; // Multi-tenant library scope
  library: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
    logoPublicId?: string;
    website?: string;
    gstNumber?: string;
  };
  plans: IPlanConfig[];
  workingHours: IWorkingHours;
  timezone: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const planConfigSchema = new Schema<IPlanConfig>(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    durationDays: { type: Number, required: true },
    price: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const settingsSchema = new Schema<ISettings>(
  {
    libraryId: {
      type: Schema.Types.ObjectId,
      ref: 'Library',
    },
    library: {
      name: { type: String, required: true, default: 'My Study Library' },
      address: String,
      phone: String,
      email: String,
      logo: String,
      logoPublicId: String,
      website: String,
      gstNumber: String,
    },
    plans: {
      type: [planConfigSchema],
      default: [
        { name: 'Monthly', type: 'monthly', durationDays: 30, price: 500, isActive: true },
        { name: 'Quarterly', type: 'quarterly', durationDays: 90, price: 1400, isActive: true },
        { name: 'Half-Yearly', type: 'half-yearly', durationDays: 180, price: 2700, isActive: true },
        { name: 'Yearly', type: 'yearly', durationDays: 365, price: 5000, isActive: true },
      ],
    },
    workingHours: {
      open: { type: String, default: '06:00' },
      close: { type: String, default: '22:00' },
      daysOpen: {
        type: [String],
        default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      },
    },
    timezone: { type: String, default: 'Asia/Kolkata' },
    currency: { type: String, default: 'INR' },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

settingsSchema.index({ libraryId: 1 }, { unique: true, sparse: true });

export const Settings: Model<ISettings> = mongoose.model<ISettings>('Settings', settingsSchema);
