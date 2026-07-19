/**
 * User controller — Multi-tenant staff management controller
 */

import { Response } from 'express';
import { AuthRequest } from '../../shared/types';
import {
  successResponse,
  createdResponse,
  paginationMeta,
} from '../../shared/helpers/api-response';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
} from './user.service';

export async function listUsers(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? (req.query.libraryId as string) : req.libraryId;
  const result = await getAllUsers({ ...req.query, libraryId: libId } as any);
  successResponse(res, result.data, 'Users fetched', 200, paginationMeta(result.total, result.page, result.limit));
}

export async function addUser(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? (req.body.libraryId || req.libraryId) : req.libraryId;
  const user = await createUser(req.body, libId);
  createdResponse(res, (user as any).toSafeObject(), 'User created successfully');
}

export async function editUser(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? undefined : req.libraryId;
  const user = await updateUser(req.params.id, req.body, libId);
  successResponse(res, (user as any).toSafeObject(), 'User updated successfully');
}

export async function removeUser(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? undefined : req.libraryId;
  await deleteUser(req.params.id, req.user.id, libId);
  successResponse(res, null, 'User deleted successfully');
}

export async function resetPassword(req: AuthRequest, res: Response): Promise<void> {
  const libId = req.user.role === 'super_admin' ? undefined : req.libraryId;
  await resetUserPassword(req.params.id, req.body.newPassword, libId);
  successResponse(res, null, 'Password reset successfully');
}
