import { Router } from 'express';
import * as listingsController from './listings.controller';
import { validate } from '../../middleware/validate';
import { authMiddleware, authorize } from '../../middleware/auth';
import { createListingSchema, getListingsQuerySchema } from '@food-bridge/shared';

const router = Router();

// Protected routes (requires auth)
router.use(authMiddleware);

router.post(
  '/upload-signature',
  authorize('DONOR', 'ADMIN'),
  listingsController.generateUploadSignature,
);
router.post(
  '/',
  authorize('DONOR'),
  validate(createListingSchema as any),
  listingsController.createListing,
);
router.get('/', validate(getListingsQuerySchema as any), listingsController.getListings);
router.get('/mine', authorize('DONOR'), listingsController.getMyListings);
router.get('/:id', listingsController.getListingDetails);
router.patch('/:id', authorize('DONOR'), listingsController.updateListing);
router.delete('/:id', authorize('DONOR'), listingsController.deleteListing);

export default router;
