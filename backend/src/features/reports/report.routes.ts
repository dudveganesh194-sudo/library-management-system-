import { Router } from 'express';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.middleware';
import { ROLES } from '../../shared/constants';
import { dashboardStats, revenueTrend, expiringMembers, occupancyReport, paymentMethodStats } from './report.controller';

const router = Router();
router.use(authenticate as any, requireTenant as any);

// Operational reports — available to Owner, Manager, Receptionist
router.get('/dashboard', authorize(ROLES.OWNER, ROLES.MANAGER, ROLES.RECEPTIONIST) as any, dashboardStats as any);
router.get('/expiring', authorize(ROLES.OWNER, ROLES.MANAGER, ROLES.RECEPTIONIST) as any, expiringMembers as any);
router.get('/occupancy', authorize(ROLES.OWNER, ROLES.MANAGER, ROLES.RECEPTIONIST) as any, occupancyReport as any);

// Financial analytics & revenue reports — Owner and Manager only
router.use(authorize(ROLES.OWNER, ROLES.MANAGER) as any);
router.get('/revenue-trend', revenueTrend as any);
router.get('/payment-methods', paymentMethodStats as any);

export default router;
