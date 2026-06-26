import { Request, Response } from 'express';

export const register = async (req: Request, res: Response): Promise<void> => {
  res.status(201).json({ status: 'ok', message: 'Registration endpoint ready' });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({ status: 'ok', message: 'Login endpoint ready' });
};

export const me = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({ status: 'ok', userId: req.userId });
};
