import { Request, Response } from 'express';

export const create = async (req: Request, res: Response): Promise<void> => {
  res.status(201).json({ status: 'ok', message: 'Create request endpoint ready' });
};

export const findAll = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({ status: 'ok', data: [] });
};

export const findById = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({ status: 'ok', data: null });
};

export const updateStatus = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({ status: 'ok', message: 'Update request status endpoint ready' });
};
