/**
 * Standardized API response helpers.
 * All controllers use these to ensure consistent response shape.
 *
 * Success: { success: true, data, message, meta? }
 * Error:   { success: false, error, message }
 */

import { Response } from 'express';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function successResponse<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: PaginationMeta
): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta && { meta }),
  });
}

export function createdResponse<T>(res: Response, data: T, message = 'Created successfully'): Response {
  return successResponse(res, data, message, 201);
}

export function errorResponse(res: Response, message: string, statusCode = 500, error?: unknown): Response {
  const response: any = {
    success: false,
    message,
  };
  if (process.env.NODE_ENV === 'development' && error) {
    response.error = String(error);
  }
  return res.status(statusCode).json(response);
}

export function paginationMeta(total: number, page: number, limit: number): PaginationMeta {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
