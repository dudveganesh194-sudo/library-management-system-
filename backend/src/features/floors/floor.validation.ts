import Joi from 'joi';

export const createFloorSchema = Joi.object({
  floorNumber: Joi.number().integer().min(0).required(),
  name: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().allow('', null),
});

export const updateFloorSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100),
  description: Joi.string().trim().allow('', null),
});
