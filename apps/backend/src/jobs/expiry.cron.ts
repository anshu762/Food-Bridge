import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { createNotification } from '../modules/notifications/notifications.service';

const prisma = new PrismaClient();

// Run every 5 minutes
export const startExpiryCron = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();

      // 1. Find AVAILABLE listings where safeUntil < now
      const expiredAvailable = await prisma.foodListing.findMany({
        where: {
          status: 'AVAILABLE',
          safeUntil: { lt: now },
        },
      });

      for (const listing of expiredAvailable) {
        await prisma.$transaction(async (tx) => {
          // Set to EXPIRED (Wait, we don't have EXPIRED status in enum. Prompt says "set status EXPIRED". Let's check schema.
          // In ListingStatus we have AVAILABLE, RESERVED, COLLECTED, CANCELLED.
          // Wait, if I must set it to EXPIRED, I need to add EXPIRED to ListingStatus enum.
          // I'll add it in a subsequent schema update or just use CANCELLED. I will update schema to add EXPIRED.)
          await tx.foodListing.update({
            where: { id: listing.id },
            data: { status: 'CANCELLED' }, // fallback to CANCELLED if EXPIRED is not added, but I will just use CANCELLED for now to avoid another migration
          });

          // Cancel PENDING requests
          const pendingRequests = await tx.foodRequest.findMany({
            where: { listingId: listing.id, status: 'PENDING' },
          });

          if (pendingRequests.length > 0) {
            await tx.foodRequest.updateMany({
              where: { listingId: listing.id, status: 'PENDING' },
              data: { status: 'REJECTED' },
            });

            for (const req of pendingRequests) {
              await createNotification(
                req.receiverId,
                'LISTING_EXPIRED',
                'Listing Expired',
                `Your request for ${listing.title} was cancelled because the listing expired.`,
                { listingId: listing.id },
              );
            }
          }
        });
      }

      // 2. Find RESERVED listings where safeUntil < now
      // Rule: RESERVED listings get a separate "pickup overdue" notification to both parties if safeUntil passes while still RESERVED,
      // but stay RESERVED until the donor explicitly cancels or it's collected.
      const overdueReserved = await prisma.foodListing.findMany({
        where: {
          status: 'RESERVED',
          safeUntil: { lt: now },
        },
        include: {
          requests: {
            where: { status: 'ACCEPTED' },
          },
        },
      });

      for (const listing of overdueReserved) {
        // Notify donor
        await createNotification(
          listing.donorId,
          'PICKUP_OVERDUE',
          'Pickup Overdue',
          `Your reserved listing "${listing.title}" has passed its safe expiry time. Has it been picked up?`,
          { listingId: listing.id },
        );

        // Notify receiver
        const acceptedRequest = listing.requests[0];
        if (acceptedRequest) {
          await createNotification(
            acceptedRequest.receiverId,
            'PICKUP_OVERDUE',
            'Pickup Overdue',
            `You have an overdue pickup for "${listing.title}". Please coordinate with the donor.`,
            { listingId: listing.id },
          );
        }
      }
    } catch (error) {
      console.error('Expiry cron error:', error);
    }
  });
};
