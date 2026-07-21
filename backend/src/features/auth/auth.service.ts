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
  ForbiddenError,
  NotFoundError,
  AppError,
} from '../../middleware/error.middleware';
import { AuthUser } from '../../shared/types';
import { logger } from '../../shared/helpers/logger';
import { ROLES, LIBRARY_STATUS } from '../../shared/constants';

export async function loginService(
  identifier: string,
  password: string
): Promise<{ accessToken: string; refreshToken: string; user: Omit<IUser, 'password'> }> {
  const cleanId = (identifier || '').trim();
  const escapedId = cleanId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Find user by email, name/username (case-insensitive), or phone
  const user = await User.findOne({
    $or: [
      { email: cleanId.toLowerCase() },
      { name: { $regex: `^${escapedId}$`, $options: 'i' } },
      { phone: cleanId },
    ],
  }).populate('libraryId').select('+password +refreshTokens');

  if (!user) {
    throw new UnauthorizedError('Invalid username/email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid username/email or password');
  }

  // Check if non-super_admin user belongs to a suspended library
  if (user.role !== ROLES.SUPER_ADMIN && user.libraryId) {
    const rawLib = user.libraryId as any;
    if (rawLib && (rawLib.status === LIBRARY_STATUS.SUSPENDED || rawLib.status === 'suspended')) {
      throw new ForbiddenError('Your library account has been suspended. Please contact customer support.');
    }
  }

  if (!user.isActive) {
    // If user is inactive due to library suspension
    if (user.libraryId && (user.libraryId as any).status === LIBRARY_STATUS.SUSPENDED) {
      throw new ForbiddenError('Your library account has been suspended. Please contact customer support.');
    }
    throw new ForbiddenError('Your account is inactive. Please contact your library administrator.');
  }

  // Extract the raw ObjectId string from libraryId (handles both populated and unpopulated cases)
  let libId: string | undefined;
  if (user.libraryId) {
    const rawLib = user.libraryId as any;
    libId = rawLib._id ? String(rawLib._id) : String(rawLib);
  }

  const payload: AuthUser = {
    id: String(user._id),
    email: user.email,
    role: user.role,
    name: user.name,
    libraryId: libId,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(String(user._id));

  // Store refresh token (keep only last 5)
  user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
  user.lastLogin = new Date();
  await user.save();

  logger.info(`User logged in: ${user.email}`);

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

  const user = await User.findById(decoded.id).populate('libraryId').select('+refreshTokens');
  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  // Check if non-super_admin user belongs to a suspended library
  if (user.role !== ROLES.SUPER_ADMIN && user.libraryId) {
    const rawLib = user.libraryId as any;
    if (rawLib && (rawLib.status === LIBRARY_STATUS.SUSPENDED || rawLib.status === 'suspended')) {
      throw new ForbiddenError('Your library account has been suspended. Please contact customer support.');
    }
  }

  if (!user.isActive) {
    throw new UnauthorizedError('User not found or inactive');
  }

  if (!user.refreshTokens.includes(token)) {
    // Token reuse detected — revoke all tokens (security measure)
    user.refreshTokens = [];
    await user.save();
    throw new UnauthorizedError('Token reuse detected. Please login again.');
  }

  // Extract the raw ObjectId string from libraryId (handles both populated and unpopulated cases)
  let libId: string | undefined;
  if (user.libraryId) {
    const rawLib = user.libraryId as any;
    libId = rawLib._id ? String(rawLib._id) : String(rawLib);
  }

  const payload: AuthUser = {
    id: String(user._id),
    email: user.email,
    role: user.role,
    name: user.name,
    libraryId: libId,
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
