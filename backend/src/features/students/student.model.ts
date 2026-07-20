/**
 * Student Model — represents library members (Multi-tenant scoped by libraryId).
 *
 * Each student can have one assigned seat, a membership plan,
 * and uploaded documents (photo, ID proof) stored on Cloudinary.
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import {
  PLAN_TYPE,
  PlanType,
  STUDENT_STATUS,
  StudentStatus,
} from '../../shared/constants';

export interface IStudent extends Document {
  libraryId?: Types.ObjectId; // Multi-tenant library scope
  studentId: string; // Human-readable: STU-01 per library
  name: string;
  email?: string;
  phone: string;
  address?: string;
  photo?: string;
  photoPublicId?: string;
  idProof?: string;
  idProofPublicId?: string;
  joinDate: Date;
  plan: PlanType;
  shiftType?: string;
  shiftHours?: number;
  startTime?: string;
  endTime?: string;
  timeSlot?: string;
  seatId?: Types.ObjectId;
  status: StudentStatus;
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
  {
    libraryId: {
      type: Schema.Types.ObjectId,
      ref: 'Library',
    },
    studentId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
      sparse: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian phone number'],
    },
    address: { type: String, trim: true },
    photo: { type: String },
    photoPublicId: { type: String },
    idProof: { type: String },
    idProofPublicId: { type: String },
    joinDate: {
      type: Date,
      required: [true, 'Join date is required'],
      default: Date.now,
    },
    plan: {
      type: String,
      enum: Object.values(PLAN_TYPE),
      required: [true, 'Membership plan is required'],
    },
    shiftType: { type: String, default: 'full_day' },
    shiftHours: { type: Number, default: 24 },
    startTime: { type: String, trim: true },
    endTime: { type: String, trim: true },
    timeSlot: { type: String, trim: true },
    seatId: {
      type: Schema.Types.ObjectId,
      ref: 'Seat',
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(STUDENT_STATUS),
      default: STUDENT_STATUS.ACTIVE,
    },
    notes: { type: String, trim: true },
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
studentSchema.index({ libraryId: 1, studentId: 1 }, { unique: true, sparse: true });
studentSchema.index({ libraryId: 1, phone: 1 });
studentSchema.index({ libraryId: 1, status: 1 });
studentSchema.index({ libraryId: 1, createdAt: -1 });
studentSchema.index({ libraryId: 1, createdBy: 1 });
studentSchema.index({ libraryId: 1, seatId: 1 });
studentSchema.index({ name: 'text', email: 'text', phone: 'text', studentId: 'text' });

export const Student: Model<IStudent> = mongoose.model<IStudent>('Student', studentSchema);
