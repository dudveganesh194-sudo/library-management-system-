/**
 * Student routes (Multi-tenant secured with requireTenant)
 */

import { Router } from 'express';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { uploadStudentFiles, uploadImportFile } from '../../middleware/upload.middleware';
import { ROLES } from '../../shared/constants';
import {
  listStudents,
  getStudent,
  addStudent,
  editStudent,
  removeStudent,
  studentPayments,
  importStudents,
  downloadTemplate,
  markLeft,
  rejoin,
} from './student.controller';
import { createStudentSchema, updateStudentSchema, markStudentLeftSchema } from './student.validation';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate as any);
router.use(requireTenant as any);

router.get('/', listStudents as any);
router.get('/template', downloadTemplate as any);
router.post('/import', uploadImportFile as any, importStudents as any);
router.post('/', uploadStudentFiles, validate(createStudentSchema, 'body'), addStudent as any);
router.get('/:id', getStudent as any);
router.put('/:id', uploadStudentFiles, validate(updateStudentSchema, 'body'), editStudent as any);
router.delete('/:id', authorize(ROLES.OWNER, ROLES.MANAGER) as any, removeStudent as any);
router.get('/:id/payments', studentPayments as any);
router.post('/:id/leave', validate(markStudentLeftSchema, 'body'), markLeft as any);
router.post('/:id/rejoin', rejoin as any);

export default router;

