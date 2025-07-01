import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { CustomRequest } from 'src/types';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';

/**
 * @desc    Get authenticated user's profile
 * @route   GET /api/user/profile
 * @access  Private (requires 'protect' middleware)
 * @param   {Request} req - Express Request object (req.user populated by auth.middleware.ts)
 * @param   {Response} res - Express Response object
 */

const getUserProfile = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    // The 'protect' middleware should ensure req.user exists and has an ID.
    if (!req.user || !req.user.id) {
      return sendResponse(
        res,
        STATUS_CODES.UNAUTHORIZED,
        null,
        'Not authorized, no user ID in token.'
      );
    }

    // Fetch the user from the database using the ID from the token
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      omit: {
        googleAccessToken: true,
        googleRefreshToken: true,
        appleRefreshToken: true,
      },
    });

    if (user) {
      return sendResponse(
        res,
        STATUS_CODES.OK,
        user,
        'User profile fetched successfully.'
      );
    } else {
      // This case should ideally not be hit if the token is valid and refers to an existing user.
      // It might indicate a database inconsistency or a deleted user.
      return sendResponse(res, STATUS_CODES.NOT_FOUND, null, 'User not found.');
    }
  }
);

export default getUserProfile;
