import { Router } from 'express';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.middleware';
import { uploadLogo } from '../../middleware/upload.middleware';
import { ROLES } from '../../shared/constants';
import { fetchSettings, saveSettings, uploadLogoHandler } from './settings.controller';

const router = Router();
router.use(authenticate as any);
router.use(requireTenant as any);

router.get('/', fetchSettings as any);
router.put('/', authorize(ROLES.OWNER) as any, saveSettings as any);
router.post('/logo', authorize(ROLES.OWNER) as any, uploadLogo, uploadLogoHandler as any);

export default router;
