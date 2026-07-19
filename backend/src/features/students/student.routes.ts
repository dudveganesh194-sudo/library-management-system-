/**
 * Student routes (Multi-tenant secured with requireTenant)
 */

import { Router } from 'express';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { uploadStudentFiles } from '../../middleware/upload.middleware';
import { ROLES } from '../../shared/constants';
import {
  listStudents,
  getStudent,
  addStudent,
  editStudent,
  removeStudent,
  studentPayments,
} from './student.controller';
import { createStudentSchema, updateStudentSchema } from './student.validation';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate as any);
router.use(requireTenant as any);

router.get('/', listStudents as any);
router.post('/', uploadStudentFiles, validate(createStudentSchema, 'body'), addStudent as any);
router.get('/:id', getStudent as any);
router.put('/:id', uploadStudentFiles, validate(updateStudentSchema, 'body'), editStudent as any);
router.delete('/:id', authorize(ROLES.OWNER, ROLES.MANAGER) as any, removeStudent as any);
router.get('/:id/payments', studentPayments as any);

export default router;
