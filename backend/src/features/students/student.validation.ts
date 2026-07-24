import Joi from 'joi';
import { PLAN_TYPE, STUDENT_STATUS } from '../../shared/constants';

export const createStudentSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim().required(),
  email: Joi.string().email().lowercase().trim().allow('', null),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({ 'string.pattern.base': 'Please enter a valid 10-digit Indian phone number' }),
  address: Joi.string().trim().allow('', null),
  joinDate: Joi.date().default(() => new Date()),
  plan: Joi.string()
    .valid(...Object.values(PLAN_TYPE))
    .required(),
  shiftType: Joi.string().allow('', null),
  shiftHours: Joi.number().min(1).max(24).allow(null),
  startTime: Joi.string().allow('', null),
  endTime: Joi.string().allow('', null),
  timeSlot: Joi.string().allow('', null),
  seatId: Joi.string().hex().length(24).allow('', null),
  notes: Joi.string().trim().allow('', null),
  recordInitialPayment: Joi.boolean().allow(null),
  paymentAmount: Joi.number().min(0).allow(null, ''),
  paymentMethod: Joi.string().valid('cash', 'upi', 'card').allow('', null),
  paymentStartDate: Joi.date().allow('', null),
  paymentNotes: Joi.string().trim().allow('', null),
});

export const updateStudentSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim(),
  email: Joi.string().email().lowercase().trim().allow('', null),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .messages({ 'string.pattern.base': 'Please enter a valid 10-digit Indian phone number' }),
  address: Joi.string().trim().allow('', null),
  // The edit form includes the student's original join date. Without this
  // rule Joi strips it, making the date impossible to update.
  joinDate: Joi.date(),
  plan: Joi.string().valid(...Object.values(PLAN_TYPE)),
  shiftType: Joi.string().allow('', null),
  shiftHours: Joi.number().min(1).max(24).allow(null),
  startTime: Joi.string().allow('', null),
  endTime: Joi.string().allow('', null),
  timeSlot: Joi.string().allow('', null),
  status: Joi.string().valid(...Object.values(STUDENT_STATUS)),
  notes: Joi.string().trim().allow('', null),
  recordInitialPayment: Joi.boolean().allow(null),
  paymentAmount: Joi.number().min(0).allow(null, ''),
  paymentMethod: Joi.string().valid('cash', 'upi', 'card').allow('', null),
  paymentStartDate: Joi.date().allow('', null),
  paymentNotes: Joi.string().trim().allow('', null),
});

export const markStudentLeftSchema = Joi.object({
  leaveDate: Joi.date().default(() => new Date()),
  leaveReason: Joi.string().trim().allow('', null),
  notes: Joi.string().trim().allow('', null),
});
