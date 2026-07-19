/**
 * Request validation middleware using Joi schemas.
 * Validates req.body, req.query, or req.params.
 *
 * Usage:
 *   router.post('/route', validate(myJoiSchema), handler)
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from './error.middleware';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: Joi.ObjectSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((d) => d.message).join('; ');
      throw new ValidationError(messages);
    }

    // Replace the request data with the validated (and stripped) value
    req[target] = value;
    next();
  };
}
