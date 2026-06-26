import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../../middleware/errorHandler';
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '@food-bridge/shared';

const prisma = new PrismaClient();

const generateTokens = (userId: string) => {
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';

  const accessToken = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: RegisterInput = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('Email is already registered', StatusCodes.CONFLICT);
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        phone: data.phone,
        role: data.role as 'DONOR' | 'RECEIVER',
        // Type assertion needed because of the discriminated union on client side
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        orgName: (data as any).orgName,
        verificationStatus: 'PENDING',
      },
    });

    const { accessToken, refreshToken } = generateTokens(user.id);
    const refreshSalt = await bcrypt.genSalt(10);
    const refreshTokenHash = await bcrypt.hash(refreshToken, refreshSalt);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, refreshTokenHash, ...userWithoutSecrets } = user;

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: {
        user: userWithoutSecrets,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: LoginInput = req.body;

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError('Invalid credentials', StatusCodes.UNAUTHORIZED);
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid credentials', StatusCodes.UNAUTHORIZED);
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    const refreshSalt = await bcrypt.genSalt(10);
    const refreshTokenHash = await bcrypt.hash(refreshToken, refreshSalt);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, refreshTokenHash, ...userWithoutSecrets } = user;

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        user: userWithoutSecrets,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError('Refresh token is required', StatusCodes.BAD_REQUEST);
    }

    const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: string };
    } catch (error) {
      throw new AppError('Invalid or expired refresh token', StatusCodes.UNAUTHORIZED);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !user.refreshTokenHash) {
      throw new AppError('Invalid or expired refresh token', StatusCodes.UNAUTHORIZED);
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isMatch) {
      throw new AppError('Invalid or expired refresh token', StatusCodes.UNAUTHORIZED);
    }

    const tokens = generateTokens(user.id);
    const refreshSalt = await bcrypt.genSalt(10);
    const newRefreshTokenHash = await bcrypt.hash(tokens.refreshToken, refreshSalt);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: newRefreshTokenHash },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Not authenticated', StatusCodes.UNAUTHORIZED);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body as ForgotPasswordInput;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return res.status(StatusCodes.OK).json({
        success: true,
        message: 'If the email exists, a reset link has been sent.',
      });
    }

    const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET || 'fallback_reset_secret';
    const resetToken = jwt.sign({ id: user.id }, JWT_RESET_SECRET, { expiresIn: '1h' });

    // TODO: Integrate actual email service here
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[DEV] Password reset link generated for ${email}: /reset-password?token=${resetToken}`,
      );
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'If the email exists, a reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = req.body as ResetPasswordInput;

    const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET || 'fallback_reset_secret';
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_RESET_SECRET) as { id: string };
    } catch (error) {
      throw new AppError('Invalid or expired reset token', StatusCodes.UNAUTHORIZED);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      throw new AppError('Invalid or expired reset token', StatusCodes.UNAUTHORIZED);
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password and invalidate all existing refresh tokens
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        refreshTokenHash: null, // Invalidates existing sessions
      },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    next(error);
  }
};
