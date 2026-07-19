import { Router } from 'express';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { ROLES } from '../../shared/constants';
import { listPayments, getPayment, addPayment, editPayment, revenueStats } from './payment.controller';
import { createPaymentSchema, updatePaymentSchema } from './payment.validation';

const router = Router();
router.use(authenticate as any);
router.use(requireTenant as any);

router.get('/revenue', authorize(ROLES.OWNER, ROLES.MANAGER) as any, revenueStats as any);
router.get('/', listPayments as any);
router.post('/', validate(createPaymentSchema), addPayment as any);
router.get('/:id', getPayment as any);
router.put('/:id', authorize(ROLES.OWNER, ROLES.MANAGER) as any, validate(updatePaymentSchema), editPayment as any);

export default router;
