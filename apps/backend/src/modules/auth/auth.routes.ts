import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '../../middleware/validate';
import { authRateLimiter } from '../../middleware/rateLimiter';
import { authMiddleware } from '../../middleware/auth';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@food-bridge/shared';

const router = Router();

// Apply rate limiting to all auth routes
router.use(authRateLimiter);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/register', validate(registerSchema as any), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.post('/logout', authMiddleware, authController.logout);

export default router;
