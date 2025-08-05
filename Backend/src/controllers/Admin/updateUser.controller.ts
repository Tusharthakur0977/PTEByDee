import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { UserRole } from '@prisma/client';

/**
 * @desc    Update user details (Admin only)
 * @route   PUT /api/admin/users/:id
 * @access  Private/Admin
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, role, isVerified } = req.body;

  try {
    // Validate ObjectId format
    if (!id || id.length !== 24) {
      return sendResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        null,
        'Invalid user ID format.'
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return sendResponse(res, STATUS_CODES.NOT_FOUND, null, 'User not found.');
    }

    // Prepare update data
    const updateData: any = {};

    if (name && name !== existingUser.name) {
      updateData.name = name.trim();
    }

    if (email && email !== existingUser.email) {
      // Check if email is already taken by another user
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          id: { not: id },
        },
      });

      if (emailExists) {
        return sendResponse(
          res,
          STATUS_CODES.CONFLICT,
          null,
          'Email is already taken by another user.'
        );
      }

      updateData.email = email;
    }

    if (role && Object.values(UserRole).includes(role)) {
      updateData.role = role;
    }

    if (typeof isVerified === 'boolean') {
      updateData.isVerified = isVerified;
    }

    // If no updates, return early
    if (Object.keys(updateData).length === 0) {
      return sendResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        null,
        'No valid fields provided for update.'
      );
    }

    updateData.updatedAt = new Date();

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        provider: true,
        isVerified: true,
        profilePictureUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            courses: true,
            testAttempts: true,
          },
        },
      },
    });

    return sendResponse(
      res,
      STATUS_CODES.OK,
      updatedUser,
      'User updated successfully.'
    );
  } catch (error: any) {
    console.error('Update user error:', error);

    if (error.code === 'P2025') {
      return sendResponse(res, STATUS_CODES.NOT_FOUND, null, 'User not found.');
    }

    return sendResponse(
      res,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      null,
      'An error occurred while updating the user. Please try again.'
    );
  }
});
