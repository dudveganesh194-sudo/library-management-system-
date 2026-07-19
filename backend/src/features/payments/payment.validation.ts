import Joi from 'joi';
import { PAYMENT_METHOD, PAYMENT_TYPE, PAYMENT_STATUS, PLAN_TYPE } from '../../shared/constants';

export const createPaymentSchema = Joi.object({
  student: Joi.string().required().messages({ 'any.required': 'Student is required' }),
  seat: Joi.string().allow('', null),
  amount: Joi.number().min(1).required(),
  method: Joi.string().valid(...Object.values(PAYMENT_METHOD)).required(),
  type: Joi.string().valid(...Object.values(PAYMENT_TYPE)).default('new'),
  plan: Joi.string().valid(...Object.values(PLAN_TYPE)).required(),
  startDate: Joi.date().default(() => new Date()),
  endDate: Joi.date().allow(null),
  status: Joi.string().valid(...Object.values(PAYMENT_STATUS)).default('paid'),
  notes: Joi.string().trim().allow('', null),
});

export const updatePaymentSchema = Joi.object({
  amount: Joi.number().min(0),
  method: Joi.string().valid(...Object.values(PAYMENT_METHOD)),
  status: Joi.string().valid(...Object.values(PAYMENT_STATUS)),
  notes: Joi.string().trim().allow('', null),
});
