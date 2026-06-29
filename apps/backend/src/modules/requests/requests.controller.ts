import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../../middleware/errorHandler';
import { createNotification } from '../notifications/notifications.service';

const prisma = new PrismaClient();

export const createRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { listingId, message } = req.body;
    const receiverId = req.user!.id;

    // Safety Critical: Transaction with row-locking
    const newRequest = await prisma.$transaction(async (tx) => {
      // 1. SELECT the listing FOR UPDATE (row lock)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listings = await tx.$queryRaw<
        any[]
      >`SELECT * FROM "FoodListing" WHERE id = ${listingId} FOR UPDATE`;

      if (!listings || listings.length === 0) {
        throw new AppError('Listing not found', StatusCodes.NOT_FOUND);
      }

      const listing = listings[0];

      // 2. If listing.status !== AVAILABLE, throw a 409
      if (listing.status !== 'AVAILABLE') {
        throw new AppError('LISTING_NOT_AVAILABLE', StatusCodes.CONFLICT);
      }

      // 3. If listing.donorId === requester's id, throw 400
      if (listing.donorId === receiverId) {
        throw new AppError('Cannot request your own listing', StatusCodes.BAD_REQUEST);
      }

      // 4. Check for existing PENDING or APPROVED requests by this user
      const existingRequest = await tx.foodRequest.findFirst({
        where: {
          listingId,
          receiverId,
          status: { in: ['PENDING', 'ACCEPTED'] },
        },
      });

      if (existingRequest) {
        throw new AppError(
          'You already have an active request for this listing',
          StatusCodes.CONFLICT,
        );
      }

      // 5. Create FoodRequest as PENDING. Do NOT change listing status.
      const request = await tx.foodRequest.create({
        data: {
          listingId,
          receiverId,
          message,
          status: 'PENDING',
        },
      });

      return { request, donorId: listing.donorId, title: listing.title };
    });

    // 6. Notify the donor
    await createNotification(
      newRequest.donorId,
      'NEW_REQUEST',
      'New Food Request',
      `Someone requested your listing: ${newRequest.title}`,
      { requestId: newRequest.request.id, listingId },
    );

    res.status(StatusCodes.CREATED).json({ success: true, data: newRequest.request });
  } catch (error) {
    next(error);
  }
};

export const approveRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const donorId = req.user!.id;

    const result = await prisma.$transaction(async (tx) => {
      // Get the request to find the listingId
      const targetRequest = await tx.foodRequest.findUnique({ where: { id } });
      if (!targetRequest) throw new AppError('Request not found', StatusCodes.NOT_FOUND);
      if (targetRequest.status !== 'PENDING')
        throw new AppError('Request is not PENDING', StatusCodes.CONFLICT);

      const listingId = targetRequest.listingId;

      // 1. Lock the listing row again
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listings = await tx.$queryRaw<
        any[]
      >`SELECT * FROM "FoodListing" WHERE id = ${listingId} FOR UPDATE`;
      if (!listings || listings.length === 0)
        throw new AppError('Listing not found', StatusCodes.NOT_FOUND);
      const listing = listings[0];

      if (listing.donorId !== donorId) throw new AppError('Not authorized', StatusCodes.FORBIDDEN);

      // 2. Confirm listing is AVAILABLE
      if (listing.status !== 'AVAILABLE') {
        throw new AppError('Listing is no longer AVAILABLE', StatusCodes.CONFLICT);
      }

      // 3. Set this request to APPROVED, set listing.status to RESERVED
      await tx.foodRequest.update({
        where: { id },
        data: { status: 'ACCEPTED' },
      });

      await tx.foodListing.update({
        where: { id: listingId },
        data: { status: 'RESERVED' },
      });

      // 4. Find all other PENDING requests, REJECT them
      const otherRequests = await tx.foodRequest.findMany({
        where: { listingId, status: 'PENDING', id: { not: id } },
      });

      if (otherRequests.length > 0) {
        await tx.foodRequest.updateMany({
          where: { listingId, status: 'PENDING', id: { not: id } },
          data: { status: 'REJECTED' },
        });

        // We will notify them outside the transaction
      }

      return {
        listingTitle: listing.title,
        targetReceiverId: targetRequest.receiverId,
        otherReceivers: otherRequests.map(r => r.receiverId),
        listingId
      };
    });

    // Notify rejected receivers
    if (result.otherReceivers.length > 0) {
      for (const receiverId of result.otherReceivers) {
        await createNotification(
          receiverId,
          'REQUEST_REJECTED',
          'Request Not Approved',
          `Your request for ${result.listingTitle} was not approved as the listing is no longer available.`,
          { listingId: result.listingId },
        );
      }
    }

    // 5. Notify the approved receiver
    await createNotification(
      result.targetReceiverId,
      'REQUEST_APPROVED',
      'Request Approved!',
      `Your request for ${result.listingTitle} has been approved! Pickup details are now unlocked.`,
      { listingId: result.listingId },
    );

    res.status(StatusCodes.OK).json({ success: true, message: 'Request approved' });
  } catch (error) {
    next(error);
  }
};

export const rejectRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await prisma.$transaction(async (tx) => {
      const targetRequest = await tx.foodRequest.findUnique({
        where: { id },
        include: { listing: true },
      });

      if (!targetRequest) throw new AppError('Request not found', StatusCodes.NOT_FOUND);
      if (targetRequest.listing.donorId !== req.user!.id)
        throw new AppError('Not authorized', StatusCodes.FORBIDDEN);
      if (targetRequest.status !== 'PENDING')
        throw new AppError('Only PENDING requests can be rejected', StatusCodes.CONFLICT);

      await tx.foodRequest.update({
        where: { id },
        data: { status: 'REJECTED' },
      });

      return {
        receiverId: targetRequest.receiverId,
        listingTitle: targetRequest.listing.title,
        listingId: targetRequest.listing.id
      };
    });

    await createNotification(
      result.receiverId,
      'REQUEST_REJECTED',
      'Request Rejected',
      `Your request for ${result.listingTitle} was rejected by the donor.`,
      { listingId: result.listingId },
    );

    res.status(StatusCodes.OK).json({ success: true, message: 'Request rejected' });
  } catch (error) {
    next(error);
  }
};

export const cancelRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const request = await prisma.foodRequest.findUnique({ where: { id } });
    if (!request) throw new AppError('Request not found', StatusCodes.NOT_FOUND);
    if (request.receiverId !== req.user!.id)
      throw new AppError('Not authorized', StatusCodes.FORBIDDEN);
    if (request.status !== 'PENDING')
      throw new AppError('Can only cancel PENDING requests', StatusCodes.CONFLICT);

    await prisma.foodRequest.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    res.status(StatusCodes.OK).json({ success: true, message: 'Request cancelled' });
  } catch (error) {
    next(error);
  }
};

export const collectRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      const targetRequest = await tx.foodRequest.findUnique({ where: { id } });
      if (!targetRequest) throw new AppError('Request not found', StatusCodes.NOT_FOUND);
      if (targetRequest.receiverId !== req.user!.id)
        throw new AppError('Not authorized', StatusCodes.FORBIDDEN);
      if (targetRequest.status !== 'ACCEPTED')
        throw new AppError(
          'Only ACCEPTED requests can be marked as collected',
          StatusCodes.CONFLICT,
        );

      // We just set listing to COLLECTED. Request stays ACCEPTED.
      // Wait, is there a COLLECTED status in request? The prompt says: "request stays APPROVED". So ACCEPTED.
      await tx.foodListing.update({
        where: { id: targetRequest.listingId },
        data: { status: 'COLLECTED' },
      });
    });

    res.status(StatusCodes.OK).json({ success: true, message: 'Marked as collected' });
  } catch (error) {
    next(error);
  }
};

export const getMyRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    const whereClause: any = { receiverId: req.user!.id };
    if (status) whereClause.status = status;

    const [requests, total] = await Promise.all([
      prisma.foodRequest.findMany({
        where: whereClause,
        include: { listing: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.foodRequest.count({ where: whereClause }),
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      data: requests,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getIncomingRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    const whereClause: any = { listing: { donorId: req.user!.id } };
    if (status) whereClause.status = status;

    const [requests, total] = await Promise.all([
      prisma.foodRequest.findMany({
        where: whereClause,
        include: { receiver: { select: { id: true, name: true, orgName: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.foodRequest.count({ where: whereClause }),
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      data: requests,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};
