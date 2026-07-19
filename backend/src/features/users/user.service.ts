/**
 * User service — CRUD for library staff accounts (Owner-only, Multi-tenant scoped by libraryId).
 *
 * Excludes Super Admin accounts from Staff Management and scopes queries strictly by libraryId.
 */

import bcrypt from 'bcryptjs';
import { User, IUser } from './user.model';
import { ConflictError, NotFoundError } from '../../middleware/error.middleware';
import { PaginatedResult, PaginationQuery } from '../../shared/types';
import { DEFAULT_LIMIT, DEFAULT_PAGE, ROLES } from '../../shared/constants';

export async function getAllUsers(
  query: PaginationQuery & { libraryId?: string }
): Promise<PaginatedResult<IUser>> {
  const page = parseInt(query.page || String(DEFAULT_PAGE), 10);
  const limit = Math.min(parseInt(query.limit || String(DEFAULT_LIMIT), 10), 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {
    role: { $in: [ROLES.OWNER, ROLES.MANAGER, ROLES.RECEPTIONIST] }, // Only fetch staff accounts
  };

  if (query.libraryId) {
    filter.libraryId = query.libraryId; // Scope to tenant library
  }

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return { data: users, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createUser(
  data: {
    name: string;
    email: string;
    password: string;
    role: string;
  },
  libraryId?: string
): Promise<IUser> {
  if (data.role === ROLES.SUPER_ADMIN) {
    throw new ConflictError('Cannot create Super Admin accounts from Staff Management');
  }

  const cleanEmail = data.email.toLowerCase().trim();
  const existing = await User.findOne({ email: cleanEmail });
  if (existing) throw new ConflictError('A user with this email already exists');

  const user = new User({
    ...data,
    email: cleanEmail,
    ...(libraryId && { libraryId: libraryId as any }),
  });

  await user.save();
  return user;
}

export async function updateUser(
  id: string,
  data: Partial<{ name: string; role: string; isActive: boolean }>,
  libraryId?: string
): Promise<IUser> {
  if (data.role === ROLES.SUPER_ADMIN) {
    throw new ConflictError('Cannot assign Super Admin role');
  }

  const filter: Record<string, unknown> = { _id: id, role: { $ne: ROLES.SUPER_ADMIN } };
  if (libraryId) filter.libraryId = libraryId;

  const user = await User.findOneAndUpdate(filter, data, { new: true, runValidators: true });
  if (!user) throw new NotFoundError('User');
  return user;
}

export async function deleteUser(id: string, requesterId: string, libraryId?: string): Promise<void> {
  if (id === requesterId) throw new ConflictError('You cannot delete your own account');

  const filter: Record<string, unknown> = { _id: id, role: { $ne: ROLES.SUPER_ADMIN } };
  if (libraryId) filter.libraryId = libraryId;

  const user = await User.findOneAndDelete(filter);
  if (!user) throw new NotFoundError('User');
}

export async function resetUserPassword(id: string, newPassword: string, libraryId?: string): Promise<void> {
  const filter: Record<string, unknown> = { _id: id, role: { $ne: ROLES.SUPER_ADMIN } };
  if (libraryId) filter.libraryId = libraryId;

  const user = await User.findOne(filter);
  if (!user) throw new NotFoundError('User');
  user.password = newPassword;
  await user.save();
}
