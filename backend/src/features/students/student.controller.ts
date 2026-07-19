/**
 * Student controller — (Multi-tenant scoped by req.libraryId)
 */

import { Response } from 'express';
import { AuthRequest } from '../../shared/types';
import {
  successResponse,
  createdResponse,
  paginationMeta,
} from '../../shared/helpers/api-response';
import {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentPayments,
} from './student.service';

export async function listStudents(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? (req.query.libraryId as string) : req.libraryId;
  const result = await getAllStudents({ ...req.query, libraryId: libId } as any);
  successResponse(res, result.data, 'Students fetched', 200, paginationMeta(result.total, result.page, result.limit));
}

export async function getStudent(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? undefined : req.libraryId;
  const student = await getStudentById(req.params.id, libId);
  successResponse(res, student);
}

export async function addStudent(req: AuthRequest, res: Response): Promise<void> {
  const files = req.files as { photo?: Express.Multer.File[]; idProof?: Express.Multer.File[] } | undefined;
  const libId = req.user.role === 'super_admin' ? (req.body.libraryId || req.libraryId) : req.libraryId;
  const student = await createStudent(req.body, req.user.id, libId, files);
  createdResponse(res, student, 'Student registered successfully');
}

export async function editStudent(req: AuthRequest, res: Response): Promise<void> {
  const files = req.files as { photo?: Express.Multer.File[]; idProof?: Express.Multer.File[] } | undefined;
  const libId = req.user.role === 'super_admin' ? undefined : req.libraryId;
  const student = await updateStudent(req.params.id, req.body, libId, files);
  successResponse(res, student, 'Student updated successfully');
}

export async function removeStudent(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? undefined : req.libraryId;
  await deleteStudent(req.params.id, libId);
  successResponse(res, null, 'Student deleted successfully');
}

export async function studentPayments(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? undefined : req.libraryId;
  const payments = await getStudentPayments(req.params.id, libId);
  successResponse(res, payments, 'Student payments fetched');
}
