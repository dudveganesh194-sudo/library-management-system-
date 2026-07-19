/**
 * Auth service — business logic for authentication.
 */

import { User, IUser } from '../users/user.model';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../middleware/auth.middleware';
import {
  UnauthorizedError,
  NotFoundError,
  AppError,
} from '../../middleware/error.middleware';
import { AuthUser } from '../../shared/types';
import { logger } from '../../shared/helpers/logger';

export async function loginService(
  email: string,
  password: string
): Promise<{ accessToken: string; refreshToken: string; user: Omit<IUser, 'password'> }> {
  // Explicitly select password (it's excluded by default)
  const user = await User.findOne({ email, isActive: true }).select('+password +refreshTokens');

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const payload: AuthUser = {
    id: String(user._id),
    email: user.email,
    role: user.role,
    name: user.name,
    libraryId: user.libraryId ? String(user.libraryId) : undefined,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(String(user._id));

  // Store refresh token (keep only last 5)
  user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
  user.lastLogin = new Date();
  await user.save();

  logger.info(`User logged in: ${email}`);

  return { accessToken, refreshToken, user: user.toSafeObject() as Omit<IUser, 'password'> };
}

export async function refreshTokenService(
  token: string
): Promise<{ accessToken: string; refreshToken: string }> {
  let decoded: { id: string };

  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user || !user.isActive) {
    throw new UnauthorizedError('User not found or inactive');
  }

  if (!user.refreshTokens.includes(token)) {
    // Token reuse detected — revoke all tokens (security measure)
    user.refreshTokens = [];
    await user.save();
    throw new UnauthorizedError('Token reuse detected. Please login again.');
  }

  const payload: AuthUser = {
    id: String(user._id),
    email: user.email,
    role: user.role,
    name: user.name,
    libraryId: user.libraryId ? String(user.libraryId) : undefined,
  };

  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(String(user._id));

  // Rotate refresh token
  user.refreshTokens = user.refreshTokens
    .filter((t) => t !== token)
    .slice(-4)
    .concat(newRefreshToken);

  await user.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logoutService(userId: string, token: string): Promise<void> {
  const user = await User.findById(userId).select('+refreshTokens');
  if (!user) return;

  user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
  await user.save();
}

export async function changePasswordService(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new NotFoundError('User');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Current password is incorrect', 400);

  user.password = newPassword;
  user.refreshTokens = []; // Invalidate all sessions on password change
  await user.save();
}
