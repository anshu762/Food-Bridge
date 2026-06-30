import { Router } from 'express';
import * as usersController from './users.controller';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';

const router = Router();

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  orgName: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
});

router.get('/', authMiddleware, usersController.findAll);
router.get('/me', authMiddleware, usersController.getMyProfile);
router.get('/:id', authMiddleware, usersController.findById);

// Own profile endpoints
router.patch('/me', authMiddleware, validate(updateProfileSchema), usersController.updateProfile);
router.put(
  '/me/password',
  authMiddleware,
  validate(changePasswordSchema),
  usersController.changePassword,
);
router.delete('/me', authMiddleware, usersController.deleteAccount);

export default router;
