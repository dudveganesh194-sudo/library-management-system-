/**
 * Seat service — manage library seats and assignments (Multi-tenant scoped by libraryId).
 */

import { Seat, ISeat } from './seat.model';
import { Student } from '../students/student.model';
import { Payment } from '../payments/payment.model';
import { NotFoundError, ConflictError, AppError } from '../../middleware/error.middleware';
import { SEAT_STATUS, STUDENT_STATUS } from '../../shared/constants';

export interface BulkSeatInput {
  floor: number;
  section: string;
  prefix?: string;
  startNumber: number;
  endNumber: number;
  padding: 0 | 2 | 3;
  type: 'standard' | 'premium';
  price: number;
  reservedSeatCharge?: number | null;
  libraryId?: string;
}

export interface BulkSeatResult {
  created: number;
  skipped: number;
  duplicates: string[];
}

function buildBulkSeatNumbers(input: BulkSeatInput): string[] {
  const prefix = (input.prefix || input.section).trim().toUpperCase();
  return Array.from({ length: input.endNumber - input.startNumber + 1 }, (_, index) => {
    const number = String(input.startNumber + index).padStart(input.padding, '0');
    return `${prefix}${number}`;
  });
}

/**
 * Creates a contiguous seat range for a specific library while treating existing seat numbers as
 * successful skips.
 */
export async function bulkCreateSeats(input: BulkSeatInput, libraryId?: string, userId?: string): Promise<BulkSeatResult> {
  const targetLibId = input.libraryId || libraryId;
  const seatNumbers = buildBulkSeatNumbers(input);
  const filter: Record<string, unknown> = { seatNumber: { $in: seatNumbers } };
  if (targetLibId) filter.libraryId = targetLibId;

  const existing = await Seat.find(filter)
    .select('seatNumber -_id')
    .lean();
  const duplicates = new Set(existing.map((seat) => seat.seatNumber));
  const seatsToCreate = seatNumbers.filter((seatNumber) => !duplicates.has(seatNumber));

  if (seatsToCreate.length === 0) {
    return { created: 0, skipped: duplicates.size, duplicates: [...duplicates].sort() };
  }

  try {
    await Seat.bulkWrite(
      seatsToCreate.map((seatNumber) => ({
        insertOne: {
          document: {
            ...(targetLibId && { libraryId: targetLibId }),
            ...(userId && { createdBy: userId }),
            seatNumber,
            floor: input.floor,
            section: input.section,
            type: input.type,
            price: input.price,
            reservedSeatCharge: input.reservedSeatCharge ?? null,
            status: SEAT_STATUS.AVAILABLE,
          },
        },
      })),
      { ordered: false }
    );
  } catch (error: any) {
    if (error?.writeErrors) {
      for (const writeError of error.writeErrors) {
        if (writeError.code === 11000) {
          const seatNumber = seatsToCreate[writeError.index];
          if (seatNumber) duplicates.add(seatNumber);
        } else {
          throw error;
        }
      }
    } else {
      throw error;
    }
  }

  const skipped = duplicates.size;
  return {
    created: seatsToCreate.length - (skipped - existing.length),
    skipped,
    duplicates: [...duplicates].sort(),
  };
}

export async function getAllSeats(query: {
  status?: string;
  floor?: string;
  section?: string;
  createdBy?: string;
  libraryId?: string;
}): Promise<ISeat[]> {
  const filter: Record<string, unknown> = {};
  if (query.libraryId) filter.libraryId = query.libraryId;
  if (query.status) filter.status = query.status;
  if (query.floor) filter.floor = parseInt(query.floor, 10);
  if (query.section) filter.section = query.section.toUpperCase();
  if (query.createdBy) filter.createdBy = query.createdBy;

  const seats = await Seat.find(filter)
    .populate('currentStudent', 'name studentId phone plan')
    .populate('createdBy', 'name role email')
    .sort({ floor: 1, seatNumber: 1 })
    .lean();

  const occupiedStudentIds = seats
    .filter((s: any) => s.status === 'occupied' && s.currentStudent)
    .map((s: any) => (s.currentStudent._id || s.currentStudent).toString());

  if (occupiedStudentIds.length > 0) {
    const payments = await Payment.find({
      student: { $in: occupiedStudentIds },
    }).sort({ createdAt: -1 });

    const paymentMap = new Map<string, number>();
    payments.forEach((p) => {
      const sId = p.student.toString();
      if (!paymentMap.has(sId)) {
        paymentMap.set(sId, p.amount);
      }
    });

    seats.forEach((s: any) => {
      if (s.currentStudent) {
        const sId = (s.currentStudent._id || s.currentStudent).toString();
        if (paymentMap.has(sId)) {
          s.paidAmount = paymentMap.get(sId);
        }
      }
    });
  }

  return seats as any;
}

export async function getSeatById(id: string, libraryId?: string): Promise<ISeat> {
  const filter: Record<string, unknown> = { _id: id };
  if (libraryId) filter.libraryId = libraryId;

  const seat = await Seat.findOne(filter)
    .populate('currentStudent', 'name studentId phone plan')
    .populate('createdBy', 'name role email');
  if (!seat) throw new NotFoundError('Seat');
  return seat;
}

export async function createSeat(data: Partial<ISeat>, libraryId?: string, userId?: string): Promise<ISeat> {
  const seatNum = String(data.seatNumber).toUpperCase();
  const filter: Record<string, unknown> = { seatNumber: seatNum };
  if (libraryId) filter.libraryId = libraryId;

  const existing = await Seat.findOne(filter);
  if (existing) throw new ConflictError(`Seat ${data.seatNumber} already exists in this library`);

  const seatData = {
    ...data,
    seatNumber: seatNum,
    ...(libraryId && { libraryId: libraryId as any }),
    ...(userId && { createdBy: userId as any }),
  };

  const seat = new Seat(seatData);
  await seat.save();
  return seat;
}

export async function updateSeat(id: string, data: Partial<ISeat>, libraryId?: string): Promise<ISeat> {
  const filter: Record<string, unknown> = { _id: id };
  if (libraryId) filter.libraryId = libraryId;

  const seat = await Seat.findOneAndUpdate(filter, data, {
    new: true,
    runValidators: true,
  });
  if (!seat) throw new NotFoundError('Seat');
  return seat;
}

export async function deleteSeat(id: string, libraryId?: string): Promise<void> {
  const filter: Record<string, unknown> = { _id: id };
  if (libraryId) filter.libraryId = libraryId;

  const seat = await Seat.findOne(filter);
  if (!seat) throw new NotFoundError('Seat');
  if (seat.status === SEAT_STATUS.OCCUPIED) {
    throw new AppError('Cannot delete an occupied seat. Please release the seat first.', 400);
  }
  await seat.deleteOne();
}

export async function assignSeat(seatId: string, studentId: string, libraryId?: string): Promise<ISeat> {
  const seatFilter: Record<string, unknown> = { _id: seatId };
  const studentFilter: Record<string, unknown> = { _id: studentId };
  if (libraryId) {
    seatFilter.libraryId = libraryId;
    studentFilter.libraryId = libraryId;
  }

  const [seat, student] = await Promise.all([
    Seat.findOne(seatFilter),
    Student.findOne(studentFilter),
  ]);

  if (!seat) throw new NotFoundError('Seat');
  if (!student) throw new NotFoundError('Student');

  if (seat.status !== SEAT_STATUS.AVAILABLE) {
    throw new ConflictError(
      seat.status === SEAT_STATUS.OCCUPIED
        ? 'Seat is already occupied'
        : `Seat is not available for assignment (${seat.status})`
    );
  }

  if (student.status !== STUDENT_STATUS.ACTIVE) {
    throw new AppError('Only active students can be assigned a seat', 400);
  }

  // Release previous seat if student already has one
  if (student.seatId) {
    await Seat.findByIdAndUpdate(student.seatId, {
      status: SEAT_STATUS.AVAILABLE,
      currentStudent: null,
    });
  }

  seat.status = SEAT_STATUS.OCCUPIED;
  seat.currentStudent = student._id as any;
  await seat.save();

  student.seatId = seat._id as any;
  await student.save();

  return seat.populate('currentStudent', 'name studentId phone');
}

export async function releaseSeat(seatId: string, libraryId?: string): Promise<ISeat> {
  const filter: Record<string, unknown> = { _id: seatId };
  if (libraryId) filter.libraryId = libraryId;

  const seat = await Seat.findOne(filter);
  if (!seat) throw new NotFoundError('Seat');

  if (seat.currentStudent) {
    await Student.findByIdAndUpdate(seat.currentStudent, { seatId: null });
  }

  seat.status = SEAT_STATUS.AVAILABLE;
  seat.currentStudent = undefined;
  await seat.save();

  return seat;
}

export async function getSeatStats(libraryId?: string): Promise<{
  total: number;
  available: number;
  occupied: number;
  reserved: number;
  maintenance: number;
  occupancyRate: number;
}> {
  const matchStage = libraryId ? { $match: { libraryId: new (require('mongoose').Types.ObjectId)(libraryId) } } : null;

  const pipeline: any[] = [];
  if (matchStage) pipeline.push(matchStage);
  pipeline.push({
    $group: {
      _id: '$status',
      count: { $sum: 1 },
    },
  });

  const stats = await Seat.aggregate(pipeline);

  const result = { total: 0, available: 0, occupied: 0, reserved: 0, maintenance: 0, occupancyRate: 0 };
  stats.forEach((s) => {
    result[s._id as keyof typeof result] = s.count;
    result.total += s.count;
  });

  if (result.total > 0) {
    result.occupancyRate = Math.round((result.occupied / result.total) * 100);
  }

  return result;
}
