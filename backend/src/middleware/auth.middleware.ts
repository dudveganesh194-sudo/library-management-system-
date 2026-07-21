/**
 * JWT Authentication, Tenant Isolation, and Role-Based Access Control middleware.
 */

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { AuthRequest, AuthUser } from '../shared/types';
import { UnauthorizedError, ForbiddenError } from './error.middleware';
import { Role, ROLES, LIBRARY_STATUS } from '../shared/constants';
import { Library } from '../features/super-admin/models/library.model';

/**
 * Verifies the JWT access token from the Authorization header.
 * Attaches the decoded user payload to req.user and tenant ID to req.libraryId.
 */
export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('No token provided');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    req.user = decoded;
    // Only accept libraryId that is a valid MongoDB ObjectId string
    const libId = decoded.libraryId;
    req.libraryId = (libId && mongoose.Types.ObjectId.isValid(libId)) ? libId : undefined;
    next();
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

/**
 * Ensures that a tenant libraryId is present for library-level operations.
 * Also checks if the target library account has been suspended by super admin.
 * Super admins can explicitly target a library via query/body or operate cross-tenant.
 */
export async function requireTenant(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError();
  }

  if (req.user.role !== ROLES.SUPER_ADMIN) {
    if (!req.libraryId) {
      throw new ForbiddenError('Tenant context missing: user is not assigned to a library');
    }

    const library = await Library.findById(req.libraryId).select('status');
    if (!library || library.status === LIBRARY_STATUS.SUSPENDED) {
      throw new ForbiddenError('Your library account has been suspended. Please contact customer support.');
    }
    if (library.status === LIBRARY_STATUS.DELETED) {
      throw new ForbiddenError('Your library account has been deleted.');
    }
  }

  next();
}

/**
 * Restricts access to specific roles.
 * Must be used after authenticate middleware.
 *
 * @param roles - One or more allowed roles
 */
export function authorize(...roles: Role[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError();
    }

    next();
  };
}

/**
 * Generates a JWT access token for a user payload.
 */
export function generateAccessToken(payload: AuthUser): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * Generates a JWT refresh token.
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * Verifies a refresh token.
 */
export function verifyRefreshToken(token: string): { id: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { id: string };
}
