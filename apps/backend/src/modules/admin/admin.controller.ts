import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Role, VerificationStatus, ListingStatus } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../../middleware/errorHandler';
import { createNotification } from '../notifications/notifications.service';

const prisma = new PrismaClient();

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    const role = req.query.role as Role | undefined;
    const verificationStatus = req.query.verificationStatus as VerificationStatus | undefined;
    const search = req.query.search as string | undefined;

    const whereClause: any = {};
    if (role) whereClause.role = role;
    if (verificationStatus) whereClause.verificationStatus = verificationStatus;
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { orgName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          name: true,
          orgName: true,
          role: true,
          verificationStatus: true,
          phone: true,
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      data: users,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getListings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    const status = req.query.status as ListingStatus | undefined;

    const whereClause: any = {};
    if (status) whereClause.status = status;

    const [listings, total] = await Promise.all([
      prisma.foodListing.findMany({
        where: whereClause,
        include: {
          donor: { select: { id: true, name: true, orgName: true, email: true } },
          _count: { select: { requests: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.foodListing.count({ where: whereClause }),
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      data: listings,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const removeListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string') {
      throw new AppError(
        'A reason must be provided for removing a listing',
        StatusCodes.BAD_REQUEST,
      );
    }

    const listing = await prisma.foodListing.findUnique({ where: { id } });
    if (!listing) {
      throw new AppError('Listing not found', StatusCodes.NOT_FOUND);
    }

    await prisma.foodListing.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // Notify donor
    await createNotification(
      listing.donorId,
      'LISTING_REMOVED',
      'Listing Removed by Admin',
      `Your listing "${listing.title}" was removed by moderation. Reason: ${reason}`,
      { listingId: id },
    );

    res.status(StatusCodes.OK).json({ success: true, message: 'Listing removed successfully' });
  } catch (error) {
    next(error);
  }
};
