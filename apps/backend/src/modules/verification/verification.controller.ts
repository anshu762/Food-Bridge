import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../../middleware/errorHandler';

const prisma = new PrismaClient();

export const uploadVerificationDocument = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { documentUrl } = req.body;

    if (req.user!.verificationStatus === 'APPROVED') {
      throw new AppError('Already verified', StatusCodes.CONFLICT);
    }

    const doc = await prisma.verificationDocument.create({
      data: {
        userId: req.user!.id,
        documentUrl,
        status: 'PENDING',
      },
    });

    res.status(StatusCodes.CREATED).json({ success: true, data: doc });
  } catch (error) {
    next(error);
  }
};

export const getPendingVerifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      prisma.verificationDocument.findMany({
        where: { status: 'PENDING' },
        include: { user: { select: { name: true, orgName: true, role: true, email: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.verificationDocument.count({ where: { status: 'PENDING' } }),
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      data: docs,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const approveVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      const doc = await tx.verificationDocument.findUnique({ where: { id } });
      if (!doc) throw new AppError('Document not found', StatusCodes.NOT_FOUND);

      await tx.verificationDocument.update({
        where: { id },
        data: { status: 'APPROVED' },
      });

      await tx.user.update({
        where: { id: doc.userId },
        data: { verificationStatus: 'APPROVED' },
      });
    });

    res.status(StatusCodes.OK).json({ success: true, message: 'Verification approved' });
  } catch (error) {
    next(error);
  }
};

export const rejectVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      const doc = await tx.verificationDocument.findUnique({ where: { id } });
      if (!doc) throw new AppError('Document not found', StatusCodes.NOT_FOUND);

      await tx.verificationDocument.update({
        where: { id },
        data: { status: 'REJECTED' },
      });

      await tx.user.update({
        where: { id: doc.userId },
        data: { verificationStatus: 'REJECTED' },
      });
    });

    res.status(StatusCodes.OK).json({ success: true, message: 'Verification rejected' });
  } catch (error) {
    next(error);
  }
};
