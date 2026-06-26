import { Request, Response, NextFunction } from 'express';
import { PrismaClient, ListingStatus } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import cloudinary from '../../config/cloudinary';
import { AppError } from '../../middleware/errorHandler';
import { calculateHaversineDistance } from '../../utils/geo';
import { createNotification } from '../notifications/notifications.service';

const prisma = new PrismaClient();

export const generateUploadSignature = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder: 'food-bridge-listings' },
      process.env.CLOUDINARY_API_SECRET || 'fallback_secret',
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        timestamp,
        signature,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        folder: 'food-bridge-listings',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.verificationStatus !== 'APPROVED') {
      throw new AppError(
        'VERIFICATION_REQUIRED: You must be verified to post a listing',
        StatusCodes.FORBIDDEN,
      );
    }

    const listing = await prisma.foodListing.create({
      data: {
        ...req.body,
        donorId: req.user.id,
      },
    });

    res.status(StatusCodes.CREATED).json({ success: true, data: listing });
  } catch (error) {
    next(error);
  }
};

export const getListings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    const status = (req.query.status as ListingStatus) || 'AVAILABLE';
    const foodType = req.query.foodType as string;

    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
    const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : undefined;

    const whereClause: any = { status };
    if (foodType) {
      whereClause.foodType = { contains: foodType, mode: 'insensitive' };
    }

    let listings = await prisma.foodListing.findMany({
      where: whereClause,
      include: {
        donor: {
          select: { name: true, orgName: true, id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Haversine filtering and sorting
    if (lat !== undefined && lng !== undefined) {
      listings = listings.map((listing) => {
        const distance = calculateHaversineDistance(lat, lng, listing.pickupLat, listing.pickupLng);
        return { ...listing, distance };
      });

      if (radiusKm) {
        listings = listings.filter((l: any) => l.distance <= radiusKm);
      }

      listings.sort((a: any, b: any) => a.distance - b.distance);
    }

    // Manual pagination after geo-filtering (if applicable)
    const total = listings.length;
    const paginatedData =
      lat !== undefined && lng !== undefined
        ? listings.slice(skip, skip + limit)
        : await prisma.foodListing.findMany({
            where: whereClause,
            include: { donor: { select: { name: true, orgName: true, id: true } } },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          });

    const totalCount =
      lat !== undefined && lng !== undefined
        ? total
        : await prisma.foodListing.count({ where: whereClause });

    res.status(StatusCodes.OK).json({
      success: true,
      data: paginatedData,
      meta: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyListings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;
    const status = req.query.status as ListingStatus;

    const whereClause: any = { donorId: req.user!.id };
    if (status) whereClause.status = status;

    const [listings, total] = await Promise.all([
      prisma.foodListing.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.foodListing.count({ where: whereClause }),
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      data: listings,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getListingDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const listing = await prisma.foodListing.findUnique({
      where: { id },
      include: {
        donor: {
          select: { id: true, name: true, orgName: true, email: true, phone: true },
        },
      },
    });

    if (!listing) {
      throw new AppError('Listing not found', StatusCodes.NOT_FOUND);
    }

    // Mask contact info unless the requester has an APPROVED request for this listing, or is the donor
    const isDonor = req.user?.id === listing.donorId;
    let hasApprovedRequest = false;

    if (!isDonor && req.user) {
      const approvedReq = await prisma.foodRequest.findFirst({
        where: { listingId: id, receiverId: req.user.id, status: 'ACCEPTED' },
      });
      hasApprovedRequest = !!approvedReq;
    }

    if (!isDonor && !hasApprovedRequest) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const donorMasked: any = { ...listing.donor };
      delete donorMasked.email;
      delete donorMasked.phone;
      listing.donor = donorMasked;
    }

    res.status(StatusCodes.OK).json({ success: true, data: listing });
  } catch (error) {
    next(error);
  }
};

export const updateListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const listing = await prisma.foodListing.findUnique({ where: { id } });

    if (!listing) throw new AppError('Listing not found', StatusCodes.NOT_FOUND);
    if (listing.donorId !== req.user!.id)
      throw new AppError('Not authorized', StatusCodes.FORBIDDEN);

    if (listing.status !== 'AVAILABLE') {
      throw new AppError('Cannot edit a listing that is not AVAILABLE', StatusCodes.CONFLICT);
    }

    const updated = await prisma.foodListing.update({
      where: { id },
      data: req.body,
    });

    res.status(StatusCodes.OK).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      const listing = await tx.foodListing.findUnique({ where: { id } });
      if (!listing) throw new AppError('Listing not found', StatusCodes.NOT_FOUND);
      if (listing.donorId !== req.user!.id)
        throw new AppError('Not authorized', StatusCodes.FORBIDDEN);

      const approvedRequest = await tx.foodRequest.findFirst({
        where: { listingId: id, status: 'ACCEPTED' },
      });

      if (approvedRequest) {
        throw new AppError('Cannot cancel listing with an APPROVED request', StatusCodes.CONFLICT);
      }

      await tx.foodListing.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      // Find pending requests and reject them
      const pendingRequests = await tx.foodRequest.findMany({
        where: { listingId: id, status: 'PENDING' },
      });

      if (pendingRequests.length > 0) {
        await tx.foodRequest.updateMany({
          where: { listingId: id, status: 'PENDING' },
          data: { status: 'REJECTED' },
        });

        // Notify receivers
        for (const req of pendingRequests) {
          await createNotification(
            req.receiverId,
            'LISTING_CANCELLED',
            'Listing Cancelled',
            'The donor has cancelled this listing. Your request has been rejected.',
            { listingId: id },
          );
        }
      }
    });

    res.status(StatusCodes.OK).json({ success: true, message: 'Listing cancelled' });
  } catch (error) {
    next(error);
  }
};
