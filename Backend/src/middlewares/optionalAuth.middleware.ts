// src/middlewares/optionalAuth.middleware.ts
import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import prisma from '../config/prismaInstance';
import { CustomRequest } from 'src/types';

interface JwtPayload {
  id: string;
}

/**
 * Optional authentication middleware
 * Adds user information to request if valid token is provided,
 * but doesn't require authentication
 */
export const optionalAuth = asyncHandler(
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

        if (user) {
          // Attach user to the request object if found
          req.user = user;
        }
      } catch (error: any) {
        // If token is invalid, just continue without user
        console.log('Invalid token in optional auth:', error.message);
      }
    }

    // Always continue to next middleware, regardless of authentication status
    next();
  }
);
