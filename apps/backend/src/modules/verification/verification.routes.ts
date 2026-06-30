import { Router } from 'express';
import * as verificationController from './verification.controller';
import { authMiddleware, authorize } from '../../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.post('/upload', verificationController.uploadVerificationDocument);
router.get('/documents', verificationController.getMyDocuments);
router.get('/pending', authorize('ADMIN'), verificationController.getPendingVerifications);
router.patch('/:id/approve', authorize('ADMIN'), verificationController.approveVerification);
router.patch('/:id/reject', authorize('ADMIN'), verificationController.rejectVerification);

export default router;
