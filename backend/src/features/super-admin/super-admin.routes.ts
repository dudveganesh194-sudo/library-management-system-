/**
 * Super Admin Routes — all routes require super_admin role.
 *
 * Mounted at: /api/super-admin
 *
 * GET    /dashboard                 → Dashboard stats
 * GET    /libraries                 → List all libraries (paginated)
 * POST   /libraries                 → Create library
 * GET    /libraries/:id             → Get library details
 * PUT    /libraries/:id             → Update library
 * PATCH  /libraries/:id/suspend     → Suspend library
 * PATCH  /libraries/:id/activate    → Activate library
 * DELETE /libraries/:id             → Delete library (soft)
 * GET    /subscriptions             → List all subscription plans
 * GET    /subscriptions/stats       → Subscription usage stats
 * POST   /subscriptions             → Create subscription plan
 * PUT    /subscriptions/:id         → Update subscription plan
 * DELETE /subscriptions/:id         → Delete subscription plan
 * GET    /revenue                   → Revenue analytics
 * GET    /logs                      → Audit logs (paginated)
 * GET    /profile                   → Get super admin profile
 * PUT    /profile                   → Update profile
 * PUT    /profile/password          → Change password
 */

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validateZod } from '../../middleware/validateZod.middleware';
import { ROLES } from '../../shared/constants';

// Validation schemas
import { createLibrarySchema, updateLibrarySchema, libraryQuerySchema } from './library.validation';
import { createSubscriptionSchema, updateSubscriptionSchema } from './subscription.validation';

// Controller handlers
import {
  getDashboard,
  getLibraries,
  getLibraryById,
  createLibrary,
  updateLibrary,
  suspendLibrary,
  activateLibrary,
  deleteLibrary,
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getSubscriptionStats,
  getRevenue,
  getLogs,
  getProfile,
  updateProfile,
  changePassword,
  resetUserPassword,
  resetLibraryOwnerPassword,
} from './super-admin.controller';

const router = Router();

// ── All routes require authentication + super_admin role ─────────────────────
router.use(authenticate as any);
router.use(authorize(ROLES.SUPER_ADMIN) as any);

// ── Dashboard ────────────────────────────────────────────────────────────────
router.get('/dashboard', getDashboard as any);

// ── Libraries ────────────────────────────────────────────────────────────────
router.get('/libraries', validateZod(libraryQuerySchema, 'query'), getLibraries as any);
router.post('/libraries', validateZod(createLibrarySchema), createLibrary as any);
router.get('/libraries/:id', getLibraryById as any);
router.put('/libraries/:id', validateZod(updateLibrarySchema), updateLibrary as any);
router.put('/libraries/:id/reset-owner-password', resetLibraryOwnerPassword as any);
router.patch('/libraries/:id/suspend', suspendLibrary as any);
router.patch('/libraries/:id/activate', activateLibrary as any);
router.delete('/libraries/:id', deleteLibrary as any);

// ── Users (Password Management) ──────────────────────────────────────────────
router.put('/users/:userId/reset-password', resetUserPassword as any);

// ── Subscriptions ────────────────────────────────────────────────────────────
router.get('/subscriptions', getSubscriptions as any);
router.get('/subscriptions/stats', getSubscriptionStats as any);
router.post('/subscriptions', validateZod(createSubscriptionSchema), createSubscription as any);
router.put('/subscriptions/:id', validateZod(updateSubscriptionSchema), updateSubscription as any);
router.delete('/subscriptions/:id', deleteSubscription as any);

// ── Revenue ──────────────────────────────────────────────────────────────────
router.get('/revenue', getRevenue as any);

// ── Audit Logs ───────────────────────────────────────────────────────────────
router.get('/logs', getLogs as any);

// ── Profile ──────────────────────────────────────────────────────────────────
router.get('/profile', getProfile as any);
router.put('/profile', updateProfile as any);
router.put('/profile/password', changePassword as any);

export default router;
