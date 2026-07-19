/**
 * Auth routes
 *
 * POST   /api/auth/login
 * POST   /api/auth/refresh
 * POST   /api/auth/logout
 * GET    /api/auth/me
 * PUT    /api/auth/change-password
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { login, refreshToken, logout, getMe, changePassword } from './auth.controller';
import { loginSchema, refreshTokenSchema, changePasswordSchema } from './auth.validation';

const router = Router();

router.post('/login', validate(loginSchema), login as any);
router.post('/refresh', validate(refreshTokenSchema), refreshToken as any);
router.post('/logout', authenticate as any, logout as any);
router.get('/me', authenticate as any, getMe as any);
router.put('/change-password', authenticate as any, validate(changePasswordSchema), changePassword as any);

export default router;
