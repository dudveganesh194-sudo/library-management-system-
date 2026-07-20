/**
 * Auth validation schemas using Joi.
 */

import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().trim().allow('', null),
  username: Joi.string().trim().allow('', null),
  identifier: Joi.string().trim().allow('', null),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'any.required': 'Password is required',
  }),
}).or('email', 'username', 'identifier');

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, and a number',
    }),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
});
