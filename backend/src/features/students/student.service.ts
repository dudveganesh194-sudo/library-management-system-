/**
 * Student service — business logic for student management (Multi-tenant scoped by libraryId).
 */

import { Student, IStudent } from './student.model';
import { Seat } from '../seats/seat.model';
import { NotFoundError, ConflictError } from '../../middleware/error.middleware';
import { PaginatedResult, PaginationQuery } from '../../shared/types';
import { DEFAULT_LIMIT, DEFAULT_PAGE, SEAT_STATUS } from '../../shared/constants';

async function getNextStudentId(libraryId?: string): Promise<string> {
  const filter = libraryId ? { libraryId } : {};
  const last = await Student.findOne(filter, { studentId: 1 }).sort({ createdAt: -1 }).lean();
  if (!last) return 'STU-01';

  const parts = last.studentId.split('-');
  const num = parts[1] ? parseInt(parts[1], 10) + 1 : 1;
  return `STU-${String(num).padStart(2, '0')}`;
}

export async function getAllStudents(
  query: PaginationQuery & { status?: string; plan?: string; createdBy?: string; libraryId?: string }
): Promise<PaginatedResult<IStudent>> {
  const page = parseInt(query.page || String(DEFAULT_PAGE), 10);
  const limit = Math.min(parseInt(query.limit || String(DEFAULT_LIMIT), 10), 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (query.libraryId) filter.libraryId = query.libraryId;

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { phone: { $regex: query.search, $options: 'i' } },
      { studentId: { $regex: query.search, $options: 'i' } },
    ];
  }
  if (query.status) filter.status = query.status;
  if (query.plan) filter.plan = query.plan;
  if (query.createdBy) filter.createdBy = query.createdBy;

  const sortField = query.sort || 'createdAt';
  const sortOrder = query.order === 'asc' ? 1 : -1;

  const [students, total] = await Promise.all([
    Student.find(filter)
      .populate('seatId', 'seatNumber floor section')
      .populate('createdBy', 'name role email')
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean(),
    Student.countDocuments(filter),
  ]);

  return { data: students as any, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getStudentById(id: string, libraryId?: string): Promise<IStudent> {
  const filter: Record<string, unknown> = { _id: id };
  if (libraryId) filter.libraryId = libraryId;

  const student = await Student.findOne(filter)
    .populate('seatId', 'seatNumber floor section type price')
    .populate('createdBy', 'name email')
    .lean();

  if (!student) throw new NotFoundError('Student');
  return student as any;
}

export async function createStudent(
  data: Partial<IStudent> & {
    recordInitialPayment?: boolean;
    paymentAmount?: number | string;
    paymentMethod?: string;
    paymentStartDate?: string;
    paymentNotes?: string;
  },
  createdBy: string,
  libraryId?: string,
  files?: { photo?: Express.Multer.File[]; idProof?: Express.Multer.File[] }
): Promise<IStudent> {
  const studentId = await getNextStudentId(libraryId);

  const studentData: Record<string, any> = {
    ...data,
    studentId,
    createdBy: createdBy as any,
    ...(libraryId && { libraryId: libraryId as any }),
  };

  // Extract payment fields before saving student
  const shouldRecordPayment = data.recordInitialPayment === true || String(data.recordInitialPayment) === 'true';
  const payAmt = data.paymentAmount !== undefined && data.paymentAmount !== null && data.paymentAmount !== ''
    ? Number(data.paymentAmount)
    : undefined;
  const payMethod = data.paymentMethod || 'cash';
  const payStartDate = data.paymentStartDate;
  const payNotes = data.paymentNotes;

  delete studentData.recordInitialPayment;
  delete studentData.paymentAmount;
  delete studentData.paymentMethod;
  delete studentData.paymentStartDate;
  delete studentData.paymentNotes;

  // Handle uploaded files
  if (files?.photo?.[0]) {
    const file = files.photo[0] as any;
    studentData.photo = file.path || file.secure_url;
    studentData.photoPublicId = file.filename || file.public_id;
  }
  if (files?.idProof?.[0]) {
    const file = files.idProof[0] as any;
    studentData.idProof = file.path || file.secure_url;
    studentData.idProofPublicId = file.filename || file.public_id;
  }

  // If seatId is specified, check availability first
  if (studentData.seatId) {
    const seat = await Seat.findById(studentData.seatId);
    if (!seat) throw new NotFoundError('Seat');
    if (seat.status !== SEAT_STATUS.AVAILABLE) {
      throw new ConflictError('The selected seat is already occupied or not available');
    }
  }

  const student = new Student(studentData);
  await student.save();

  // If seatId is specified, occupy the seat and link it
  if (studentData.seatId) {
    await Seat.findByIdAndUpdate(studentData.seatId, {
      status: SEAT_STATUS.OCCUPIED,
      currentStudent: student._id,
    });
  }

  // Automatically record initial fee payment receipt if requested/provided
  if (shouldRecordPayment || (payAmt !== undefined && payAmt > 0)) {
    try {
      const { createPayment } = await import('../payments/payment.service');
      const targetLibId = libraryId || (student.libraryId ? String(student.libraryId) : undefined);
      await createPayment(
        {
          student: student._id,
          seat: student.seatId || undefined,
          amount: payAmt !== undefined ? payAmt : 500,
          method: (payMethod as any) || 'cash',
          type: 'new',
          plan: student.plan || 'monthly',
          startDate: payStartDate ? new Date(payStartDate) : new Date(student.joinDate || Date.now()),
          notes: payNotes || 'Initial student registration fee',
        },
        createdBy,
        targetLibId
      );
    } catch (err: any) {
      console.error('Error creating initial payment receipt for student:', err?.stack || err?.message || err);
    }
  }

  return student;
}

export async function updateStudent(
  id: string,
  data: Partial<IStudent>,
  libraryId?: string,
  files?: { photo?: Express.Multer.File[]; idProof?: Express.Multer.File[] }
): Promise<IStudent> {
  const filter: Record<string, unknown> = { _id: id };
  if (libraryId) filter.libraryId = libraryId;

  const updateData: Partial<IStudent> = { ...data };

  if (files?.photo?.[0]) {
    const file = files.photo[0] as any;
    updateData.photo = file.path || file.secure_url;
    updateData.photoPublicId = file.filename || file.public_id;
  }
  if (files?.idProof?.[0]) {
    const file = files.idProof[0] as any;
    updateData.idProof = file.path || file.secure_url;
    updateData.idProofPublicId = file.filename || file.public_id;
  }

  const student = await Student.findOneAndUpdate(filter, updateData, {
    new: true,
    runValidators: true,
  });

  if (!student) throw new NotFoundError('Student');
  return student;
}

export async function deleteStudent(id: string, libraryId?: string): Promise<void> {
  const filter: Record<string, unknown> = { _id: id };
  if (libraryId) filter.libraryId = libraryId;

  const student = await Student.findOne(filter);
  if (!student) throw new NotFoundError('Student');

  // Release seat if assigned
  if (student.seatId) {
    await Seat.findByIdAndUpdate(student.seatId, {
      status: SEAT_STATUS.AVAILABLE,
      currentStudent: null,
    });
  }

  await student.deleteOne();
}

export async function getStudentPayments(studentId: string, libraryId?: string): Promise<unknown[]> {
  const { Payment } = await import('../payments/payment.model');
  const filter: Record<string, unknown> = { student: studentId };
  if (libraryId) filter.libraryId = libraryId;

  return Payment.find(filter)
    .populate('seat', 'seatNumber')
    .populate('collectedBy', 'name')
    .sort({ createdAt: -1 })
    .lean();
}
