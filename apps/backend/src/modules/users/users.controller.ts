import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../../middleware/errorHandler';

const prisma = new PrismaClient();

export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        orgName: true,
        role: true,
        verificationStatus: true,
      },
    });
    if (!user) throw new AppError('User not found', StatusCodes.NOT_FOUND);
    res.status(StatusCodes.OK).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const findAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        verificationStatus: true,
        createdAt: true,
      },
    });
    res.status(StatusCodes.OK).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const findById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        verificationStatus: true,
        createdAt: true,
      },
    });
    if (!user) throw new AppError('User not found', StatusCodes.NOT_FOUND);
    res.status(StatusCodes.OK).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, phone, orgName } = req.body;
    const userId = req.user!.id;

    const data: Record<string, string> = {};
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;
    if (orgName !== undefined) data.orgName = orgName;

    if (Object.keys(data).length === 0) {
      throw new AppError('No fields to update', StatusCodes.BAD_REQUEST);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        orgName: true,
        role: true,
        verificationStatus: true,
      },
    });

    res.status(StatusCodes.OK).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', StatusCodes.NOT_FOUND);

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) throw new AppError('Current password is incorrect', StatusCodes.UNAUTHORIZED);

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    res.status(StatusCodes.OK).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    await prisma.user.update({
      where: { id: userId },
      data: {
        name: '[Deleted User]',
        phone: null,
        orgName: null,
        email: `deleted-${userId}@foodbridge.invalid`,
        passwordHash: '[DELETED]',
        refreshTokenHash: null,
        expoPushToken: null,
        verificationStatus: 'REJECTED',
      },
    });

    res.status(StatusCodes.OK).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};
