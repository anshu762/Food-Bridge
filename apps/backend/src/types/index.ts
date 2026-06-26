/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-namespace */
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

export {};
