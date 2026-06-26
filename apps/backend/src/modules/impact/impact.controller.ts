import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

const prisma = new PrismaClient();

export const getMyImpact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, role } = req.user!;
    let collectedCount = 0;
    let totalQuantity = 0;

    if (role === 'DONOR') {
      const aggregate = await prisma.foodListing.aggregate({
        where: { donorId: id, status: 'COLLECTED' },
        _count: { _all: true },
        _sum: { quantity: true },
      });
      collectedCount = aggregate._count._all;
      totalQuantity = aggregate._sum.quantity || 0;
    } else if (role === 'RECEIVER') {
      const requests = await prisma.foodRequest.findMany({
        where: { receiverId: id, listing: { status: 'COLLECTED' } },
        include: { listing: true },
      });
      collectedCount = requests.length;
      totalQuantity = requests.reduce((sum, req) => sum + req.listing.quantity, 0);
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: { collectedCount, totalQuantity },
    });
  } catch (error) {
    next(error);
  }
};

export const getPlatformImpact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const aggregate = await prisma.foodListing.aggregate({
      where: { status: 'COLLECTED' },
      _count: { _all: true },
      _sum: { quantity: true },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        totalCollected: aggregate._count._all,
        totalQuantity: aggregate._sum.quantity || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
