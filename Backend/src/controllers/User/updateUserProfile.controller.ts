import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { CustomRequest } from 'src/types';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { generateToken } from '../../utils/jwt';
/**
 * @desc    Update authenticated user's profile
 * @route   PUT /api/user/update-profile
 * @access  Private (requires 'protect' middleware)
 * @param   {Request} req - Express Request object (req.user populated by auth.middleware.ts)
 * @param   {Response} res - Express Response object
 */

const updateUserProfile = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    // Ensure the user is authenticated and their ID is available from the token
    if (!req.user || !req.user.id) {
      return sendResponse(
        res,
        STATUS_CODES.UNAUTHORIZED,
        null,
        'Not authorized, no user ID in token.'
      );
    }

    // Fetch the current user data to ensure it exists and for comparison
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return sendResponse(res, STATUS_CODES.NOT_FOUND, null, 'User not found.');
    }

    // Prepare data for update. Only include fields that are actually provided in the request body.
    let updateData: {
      name?: string;
      email?: string;
      password?: string;
      profilePictureUrl?: string;
    } = {};

    // Update 'name' if provided
    if (req.body.name && req.body.name !== user.name) {
      updateData.name = req.body.name;
    }

    // Update 'email' if provided and different from current email
    if (req.body.email && req.body.email !== user.email) {
      // Before updating email, check if the new email is already in use by another user
      const emailExists = await prisma.user.findUnique({
        where: { email: req.body.email },
      });

      if (emailExists && emailExists.id !== user.id) {
        // New email is already taken by a different user
        return sendResponse(
          res,
          STATUS_CODES.CONFLICT,
          null,
          'The provided email is already taken by another user.'
        );
      }
      updateData.email = req.body.email;
    }

    // Update 'profilePictureUrl' if provided
    if (
      req.body.profilePictureUrl &&
      req.body.profilePictureUrl !== user.profilePictureUrl
    ) {
      updateData.profilePictureUrl = req.body.profilePictureUrl;
    }

    // If no update data provided, return a "No Content" or "Bad Request"
    if (Object.keys(updateData).length === 0) {
      return sendResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        null,
        'No valid fields provided for update.'
      );
      // Or sendStatus(204) for "No Content" if you prefer
    }

    // Perform the update
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      // Select only non-sensitive fields for the response
      select: {
        id: true,
        name: true,
        email: true,
        isVerified: true,
        role: true,
        provider: true,
        profilePictureUrl: true,
        googleId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = generateToken({ id: updatedUser.id, role: updatedUser.role });

    return sendResponse(
      res,
      STATUS_CODES.OK,
      {
        ...updatedUser,
        token,
      },
      'User profile updated successfully.'
    );
  }
);

export default updateUserProfile;
