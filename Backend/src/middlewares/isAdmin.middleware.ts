// src/middlewares/isAdmin.middleware.ts
import { UserRole } from '@prisma/client';
import { NextFunction, Response } from 'express';
import { CustomRequest } from 'src/types';

export const isAdmin = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  // Check if req.user exists and has the 'ADMIN' role
  if (req.user && req.user.role === UserRole.ADMIN) {
    next(); // User is admin, allow access
  } else {
    res.status(403); // Forbidden
    throw new Error('Not authorized as an admin');
  }
};
