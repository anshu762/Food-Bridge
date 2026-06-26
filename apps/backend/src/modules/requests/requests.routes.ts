import { Router } from 'express';
import { create, findAll, findById, updateStatus } from './requests.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/', authenticate, findAll);
router.get('/:id', authenticate, findById);
router.post('/', authenticate, create);
router.patch('/:id/status', authenticate, updateStatus);

export default router;
