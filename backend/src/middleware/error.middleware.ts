/**
 * Centralized error handling middleware.
 *
 * Catches all errors thrown in route handlers (including async errors via
 * express-async-errors). Maps known error types to appropriate HTTP status codes.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../shared/helpers/logger';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 422);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  let statusCode = 500;
  let message = 'Internal server error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 422;
    message = err.message;
  } else if (err.name === 'CastError') {
    // Mongoose cast error (invalid ObjectId)
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (String((err as any).code) === '11000' || (err as any).code === 11000) {
    // MongoDB duplicate key error
    statusCode = 409;
    const match = err.message.match(/dup key: { (?:.*?: )?"?(.*?)"? }/);
    const dupValue = match ? match[1] : '';
    message = dupValue
      ? `A record with "${dupValue}" already exists`
      : 'A record with this email or value already exists';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
  }

  // Log non-operational errors (unexpected bugs)
  if (!(err instanceof AppError) || !err.isOperational) {
    logger.error('Unexpected error:', err);
  } else {
    logger.warn(`[${statusCode}] ${message} — ${req.method} ${req.path}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
    }),
  });
}

/** Catches 404 for unmatched routes */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
}
