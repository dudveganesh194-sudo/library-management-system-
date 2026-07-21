/**
 * Auth controller — handles HTTP layer for authentication.
 */

import { Response } from 'express';
import { AuthRequest } from '../../shared/types';
import { successResponse } from '../../shared/helpers/api-response';
import {
  loginService,
  refreshTokenService,
  logoutService,
  changePasswordService,
} from './auth.service';
import { User } from '../users/user.model';
import { NotFoundError } from '../../middleware/error.middleware';

export async function login(req: AuthRequest, res: Response): Promise<void> {
  const { email, username, identifier, password } = req.body;
  const loginId = username || identifier || email;
  const result = await loginService(loginId, password);
  successResponse(res, result, 'Login successful');
}

export async function refreshToken(req: AuthRequest, res: Response): Promise<void> {
  const { refreshToken: token } = req.body;
  const tokens = await refreshTokenService(token);
  successResponse(res, tokens, 'Token refreshed');
}

export async function logout(req: AuthRequest, res: Response): Promise<void> {
  const { refreshToken: token } = req.body;
  await logoutService(req.user.id, token || '');
  successResponse(res, null, 'Logged out successfully');
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  const user = await User.findById(req.user.id).populate('libraryId');
  if (!user) throw new NotFoundError('User');
  successResponse(res, user.toSafeObject());
}

export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  const { currentPassword, newPassword } = req.body;
  await changePasswordService(req.user.id, currentPassword, newPassword);
  successResponse(res, null, 'Password changed successfully');
}
