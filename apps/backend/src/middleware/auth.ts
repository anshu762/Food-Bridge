import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { AppError } from './errorHandler';

const prisma = new PrismaClient();

// Extend the Express Request type to include the user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        verificationStatus: string;
      };
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Not authorized, no token provided', StatusCodes.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, verificationStatus: true },
    });

    if (!user) {
      throw new AppError('Not authorized, user no longer exists', StatusCodes.UNAUTHORIZED);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Not authorized, token expired', StatusCodes.UNAUTHORIZED));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Not authorized, invalid token', StatusCodes.UNAUTHORIZED));
    }
    next(error);
  }
};

export const authenticate = authMiddleware;

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Not authorized to access this route', StatusCodes.FORBIDDEN));
    }
    next();
  };
};
