import { Router } from 'express';
import * as requestsController from './requests.controller';
import { validate } from '../../middleware/validate';
import { authMiddleware, authorize } from '../../middleware/auth';
import { createRequestSchema } from '@food-bridge/shared';

const router = Router();
router.use(authMiddleware);

router.post(
  '/',
  authorize('RECEIVER'),
  validate(createRequestSchema),
  requestsController.createRequest,
);
router.patch('/:id/approve', authorize('DONOR'), requestsController.approveRequest);
router.patch('/:id/reject', authorize('DONOR'), requestsController.rejectRequest);
router.patch('/:id/cancel', authorize('RECEIVER'), requestsController.cancelRequest);
router.patch('/:id/collect', authorize('RECEIVER'), requestsController.collectRequest);
router.get('/mine', authorize('RECEIVER'), requestsController.getMyRequests);
router.get('/incoming', authorize('DONOR'), requestsController.getIncomingRequests);

export default router;
