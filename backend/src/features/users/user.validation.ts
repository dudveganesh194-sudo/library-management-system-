import Joi from 'joi';
import { ROLES } from '../../shared/constants';

export const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim().required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase, and a number',
    }),
  role: Joi.string()
    .valid(...Object.values(ROLES))
    .required(),
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim(),
  role: Joi.string().valid(...Object.values(ROLES)),
  isActive: Joi.boolean(),
});

export const resetPasswordSchema = Joi.object({
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required(),
});
