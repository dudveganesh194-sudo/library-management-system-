/**
 * Seat Model — represents physical seating positions in the library (Multi-tenant scoped by libraryId).
 *
 * Seats can be assigned to students. When assigned, the currentStudent
 * reference is set and the status changes to 'occupied'.
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { SEAT_STATUS, SeatStatus, SEAT_TYPE, SeatType } from '../../shared/constants';

export interface ISeat extends Document {
  libraryId?: Types.ObjectId; // Multi-tenant library scope
  seatNumber: string; // e.g., "A-01", "B-12"
  floor: number;
  section: string; // e.g., "A", "B", "C"
  type: SeatType;
  status: SeatStatus;
  currentStudent?: Types.ObjectId;
  price: number; // Monthly price for this seat
  reservedSeatCharge?: number;
  amenities?: string[]; // e.g., ['power outlet', 'AC', 'window']
  notes?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const seatSchema = new Schema<ISeat>(
  {
    libraryId: {
      type: Schema.Types.ObjectId,
      ref: 'Library',
    },
    seatNumber: {
      type: String,
      required: [true, 'Seat number is required'],
      trim: true,
      uppercase: true,
    },
    floor: {
      type: Number,
      required: [true, 'Floor is required'],
      min: [0, 'Floor cannot be negative'],
    },
    section: {
      type: String,
      required: [true, 'Section is required'],
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: Object.values(SEAT_TYPE),
      default: SEAT_TYPE.STANDARD,
    },
    status: {
      type: String,
      enum: Object.values(SEAT_STATUS),
      default: SEAT_STATUS.AVAILABLE,
    },
    currentStudent: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
    },
    price: {
      type: Number,
      required: [true, 'Seat price is required'],
      min: [0, 'Price cannot be negative'],
    },
    reservedSeatCharge: {
      type: Number,
      min: [0, 'Reserved seat charge cannot be negative'],
      default: null,
    },
    amenities: {
      type: [String],
      default: [],
    },
    notes: { type: String, trim: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes ─────────────────────────────────────────────────────────────────
seatSchema.index({ libraryId: 1, seatNumber: 1 }, { unique: true, sparse: true });
seatSchema.index({ libraryId: 1, status: 1 });
seatSchema.index({ libraryId: 1, floor: 1, section: 1 });
seatSchema.index({ libraryId: 1, floor: 1, seatNumber: 1 });
seatSchema.index({ libraryId: 1, currentStudent: 1 });

export const Seat: Model<ISeat> = mongoose.model<ISeat>('Seat', seatSchema);
