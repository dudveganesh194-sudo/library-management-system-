import Joi from 'joi';
import { SEAT_TYPE, SEAT_STATUS } from '../../shared/constants';

export const createSeatSchema = Joi.object({
  seatNumber: Joi.string().trim().uppercase().required(),
  floor: Joi.number().integer().min(0).required(),
  section: Joi.string().trim().uppercase().required(),
  type: Joi.string().valid(...Object.values(SEAT_TYPE)).default('standard'),
  price: Joi.number().min(0).required(),
  status: Joi.string().valid(...Object.values(SEAT_STATUS)).default('available'),
  reservedSeatCharge: Joi.number().min(0).allow(null),
  amenities: Joi.array().items(Joi.string()).default([]),
  notes: Joi.string().trim().allow('', null),
  libraryId: Joi.string().hex().length(24).optional().allow('', null),
});

export const updateSeatSchema = Joi.object({
  seatNumber: Joi.string().trim().uppercase(),
  floor: Joi.number().integer().min(0),
  section: Joi.string().trim().uppercase(),
  type: Joi.string().valid(...Object.values(SEAT_TYPE)),
  status: Joi.string().valid(...Object.values(SEAT_STATUS)),
  price: Joi.number().min(0),
  reservedSeatCharge: Joi.number().min(0).allow(null),
  amenities: Joi.array().items(Joi.string()),
  notes: Joi.string().trim().allow('', null),
});

export const assignSeatSchema = Joi.object({
  studentId: Joi.string().required().messages({ 'any.required': 'Student ID is required' }),
});

export const bulkCreateSeatsSchema = Joi.object({
  floor: Joi.number().integer().min(0).required(),
  section: Joi.string().trim().uppercase().max(20).required(),
  prefix: Joi.string().trim().uppercase().max(20).allow(''),
  startNumber: Joi.number().integer().min(0).required(),
  endNumber: Joi.number().integer().min(Joi.ref('startNumber')).max(99999).required(),
  padding: Joi.number().integer().valid(0, 2, 3).default(0),
  type: Joi.string().valid(...Object.values(SEAT_TYPE)).default('standard'),
  price: Joi.number().min(0).required(),
  reservedSeatCharge: Joi.number().min(0).allow(null),
  libraryId: Joi.string().hex().length(24).optional().allow('', null),
}).custom((value, helpers) => {
  if (value.endNumber - value.startNumber + 1 > 500) {
    return helpers.error('any.invalid');
  }
  return value;
}).messages({
  'any.invalid': 'A bulk request can create at most 500 seats at a time',
});
