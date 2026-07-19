/**
 * Zod-based request validation middleware.
 * Used by super-admin routes. Existing Joi middleware remains for legacy routes.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from './error.middleware';

type ValidationTarget = 'body' | 'query' | 'params';

export function validateZod(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);
      (req as any)[target] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues || (err as any).errors || [];
        const messages = issues
          .map((e: any) => {
            const path = Array.isArray(e.path) ? e.path.join('.') : '';
            return path ? `${path}: ${e.message}` : e.message;
          })
          .join('; ');
        throw new ValidationError(messages || 'Validation failed');
      }
      throw err;
    }
  };
}
