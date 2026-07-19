import { Router } from 'express';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { ROLES } from '../../shared/constants';
import { listSeats, getSeat, addSeat, addSeatsInBulk, editSeat, removeSeat, assign, release, seatStats } from './seat.controller';
import { createSeatSchema, updateSeatSchema, assignSeatSchema, bulkCreateSeatsSchema } from './seat.validation';

const router = Router();
router.use(authenticate as any);
router.use(requireTenant as any);

router.get('/stats', seatStats as any);
router.get('/', listSeats as any);
router.post('/', authorize(ROLES.OWNER, ROLES.MANAGER) as any, validate(createSeatSchema), addSeat as any);
router.post('/bulk-create', authorize(ROLES.OWNER, ROLES.MANAGER) as any, validate(bulkCreateSeatsSchema), addSeatsInBulk as any);
router.get('/:id', getSeat as any);
router.put('/:id', authorize(ROLES.OWNER, ROLES.MANAGER) as any, validate(updateSeatSchema), editSeat as any);
router.delete('/:id', authorize(ROLES.OWNER, ROLES.MANAGER) as any, removeSeat as any);
router.put('/:id/assign', validate(assignSeatSchema), assign as any);
router.put('/:id/release', authorize(ROLES.OWNER, ROLES.MANAGER) as any, release as any);
router.patch('/:id/release', authorize(ROLES.OWNER, ROLES.MANAGER) as any, release as any);

export default router;
