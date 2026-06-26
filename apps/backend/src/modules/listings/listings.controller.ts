import { Request, Response } from 'express';

export const create = async (req: Request, res: Response): Promise<void> => {
  res.status(201).json({ status: 'ok', message: 'Create listing endpoint ready' });
};

export const findAll = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({ status: 'ok', data: [] });
};

export const findById = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({ status: 'ok', data: null });
};

export const update = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({ status: 'ok', message: 'Update listing endpoint ready' });
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({ status: 'ok', message: 'Delete listing endpoint ready' });
};
