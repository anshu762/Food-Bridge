import { Router } from 'express';
import { create, findAll, findById, update, remove } from './listings.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/', findAll);
router.get('/:id', findById);
router.post('/', authenticate, create);
router.put('/:id', authenticate, update);
router.delete('/:id', authenticate, remove);

export default router;
