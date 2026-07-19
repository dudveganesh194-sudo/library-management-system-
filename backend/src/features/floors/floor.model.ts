/**
 * Floor Model — represents floors inside a library (Multi-tenant scoped by libraryId).
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IFloor extends Document {
  libraryId?: Types.ObjectId; // Multi-tenant library scope
  floorNumber: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const floorSchema = new Schema<IFloor>(
  {
    libraryId: {
      type: Schema.Types.ObjectId,
      ref: 'Library',
    },
    floorNumber: {
      type: Number,
      required: [true, 'Floor number is required'],
      min: [0, 'Floor number cannot be negative'],
    },
    name: {
      type: String,
      required: [true, 'Floor name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

floorSchema.index({ libraryId: 1, floorNumber: 1 }, { unique: true, sparse: true });

export const Floor: Model<IFloor> = mongoose.model<IFloor>('Floor', floorSchema);
