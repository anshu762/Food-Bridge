import { Router } from 'express';
import * as impactController from './impact.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

router.get('/platform', impactController.getPlatformImpact);
router.get('/me', authMiddleware, impactController.getMyImpact);

export default router;
