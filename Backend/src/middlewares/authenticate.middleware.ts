// src/middlewares/auth.middleware.ts
import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler'; // Already installed as a dependency
import jwt from 'jsonwebtoken';
import prisma from '../config/prismaInstance';
import { CustomRequest } from 'src/types';

interface JwtPayload {
  id: string;
}

export const protect = asyncHandler(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      try {
        token = req.headers.authorization.split(' ')[1];

        if (!process.env.JWT_SECRET) {
          throw new Error('JWT_SECRET is not defined.');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

        // Find user by ID using Prisma Client
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
        });

        if (!user) {
          res.status(401);
          throw new Error('Not authorized, user not found');
        }

        // Remove password from the user object before attaching to request
        const User = user;
        req.user = User; // Attach user to the request object

        next();
      } catch (error: any) {
        console.error(error);
        res.status(401);
        throw new Error('Not authorized, token failed');
      }
    }

    if (!token) {
      res.status(401);
      throw new Error('Not authorized, no token');
    }
  }
);
