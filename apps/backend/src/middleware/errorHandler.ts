import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (res.headersSent) {
    return next(err);
  }

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: 'Validation Error',
      details: formattedErrors,
    });
  }

  // Handle Prisma Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (err.code === 'P2002') {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        error: `Duplicate field value entered. A record with this value already exists.`,
      });
    }
    // Record not found
    if (err.code === 'P2025') {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: 'Record not found',
      });
    }
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: 'Database Error',
    });
  }

  // Handle Custom App Errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Handle other errors (like JSON parse error)
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: 'Invalid JSON payload',
    });
  }

  // Handle generic JWT errors if any bubble up
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      error: 'Invalid or missing authentication token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      error: 'Authentication token has expired',
    });
  }

  // Fallback to 500
  console.error('Unhandled Error:', err);
  const isProduction = process.env.NODE_ENV === 'production';
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: 'Internal Server Error',
    ...(isProduction ? {} : { stack: err.stack }),
  });
};
