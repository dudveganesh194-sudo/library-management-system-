import { Router } from 'express';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { ROLES } from '../../shared/constants';
import { listFloors, addFloor, editFloor, removeFloor } from './floor.controller';
import { createFloorSchema, updateFloorSchema } from './floor.validation';

const router = Router();
router.use(authenticate as any);
router.use(requireTenant as any);

router.get('/', listFloors as any);
router.post('/', authorize(ROLES.OWNER, ROLES.MANAGER) as any, validate(createFloorSchema), addFloor as any);
router.put('/:id', authorize(ROLES.OWNER, ROLES.MANAGER) as any, validate(updateFloorSchema), editFloor as any);
router.delete('/:id', authorize(ROLES.OWNER, ROLES.MANAGER) as any, removeFloor as any);

export default router;
