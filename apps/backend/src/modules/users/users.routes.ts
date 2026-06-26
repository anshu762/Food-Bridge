import { Router } from 'express';
import { findAll, findById, update } from './users.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.get('/', authenticate, authorize('admin'), findAll);
router.get('/:id', authenticate, findById);
router.put('/:id', authenticate, update);

export default router;
