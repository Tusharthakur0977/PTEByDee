import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { sendResponse } from '../..//utils/helpers';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from './../../utils/constants';

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/admin/users
 * @access  Private/Admin (requires 'protect' and 'isAdmin' middlewares)
 * @param   {Request} req - Express Request object
 * @param   {Response} res - Express Response object
 */

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  // The 'protect' and 'isAdmin' middlewares should ensure only authenticated admins reach here.

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      provider: true, // Useful to know how the user registered
      isVerified: true,
      profilePictureUrl: true, // Include if you have it
      googleId: true, // Include if you have it and want to expose its presence
      createdAt: true,
      updatedAt: true,
    },
  });

  // Send the list of users with a 200 OK status
  return sendResponse(
    res,
    STATUS_CODES.OK,
    users,
    'Users fetched successfully.'
  );
});
