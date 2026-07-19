/**
 * User Model — represents library staff accounts and platform super admins.
 *
 * Roles: super_admin | owner | manager | receptionist
 * Passwords are hashed with bcrypt before saving.
 *
 * For owner/manager/receptionist users, `libraryId` links them to a specific library.
 * Super admins have no libraryId — they manage all libraries.
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, Role } from '../../shared/constants';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: Role;
  libraryId?: Types.ObjectId; // Links to Library (absent for super_admin)
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  avatar?: string;
  avatarPublicId?: string;
  isActive: boolean;
  lastLogin?: Date;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
  // Methods
  comparePassword(candidate: string): Promise<boolean>;
  toSafeObject(): Omit<IUser, 'password' | 'refreshTokens'>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never returned by default
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.RECEPTIONIST,
    },
    libraryId: {
      type: Schema.Types.ObjectId,
      ref: 'Library',
      default: null,
    },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pinCode: { type: String, trim: true },
    avatar: { type: String },
    avatarPublicId: { type: String },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    refreshTokens: {
      type: [String],
      default: [],
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes ─────────────────────────────────────────────────────────────────
userSchema.index({ role: 1 });
userSchema.index({ libraryId: 1 });

// ── Pre-save hook: hash password ─────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance methods ─────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  return obj;
};

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
