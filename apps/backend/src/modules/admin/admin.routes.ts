import { Router } from 'express';
import * as adminController from './admin.controller';
import { authMiddleware, authorize } from '../../middleware/auth';

const router = Router();

// Protect all admin routes
router.use(authMiddleware);
router.use(authorize('ADMIN'));

router.get('/users', adminController.getUsers);
router.get('/listings', adminController.getListings);
router.patch('/listings/:id/remove', adminController.removeListing);

export default router;
