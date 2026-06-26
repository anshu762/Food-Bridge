import { Request, Response } from 'express';

export const findAll = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({ status: 'ok', data: [] });
};

export const findById = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({ status: 'ok', data: null });
};

export const update = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({ status: 'ok', message: 'Update user endpoint ready' });
};
