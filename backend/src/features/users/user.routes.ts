/**
 * User routes — Owner only (Multi-tenant secured)
 */

import { Router } from 'express';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { ROLES } from '../../shared/constants';
import { listUsers, addUser, editUser, removeUser, resetPassword } from './user.controller';
import { createUserSchema, updateUserSchema, resetPasswordSchema } from './user.validation';

const router = Router();

// Base middleware for all user routes
router.use(authenticate as any, requireTenant as any);

// GET / list users — accessible by Owner and Manager
router.get('/', authorize(ROLES.OWNER, ROLES.MANAGER) as any, listUsers as any);

// Write operations — Owner only
router.post('/', authorize(ROLES.OWNER) as any, validate(createUserSchema), addUser as any);
router.put('/:id', authorize(ROLES.OWNER) as any, validate(updateUserSchema), editUser as any);
router.delete('/:id', authorize(ROLES.OWNER) as any, removeUser as any);
router.put('/:id/reset-password', authorize(ROLES.OWNER) as any, validate(resetPasswordSchema), resetPassword as any);

export default router;
