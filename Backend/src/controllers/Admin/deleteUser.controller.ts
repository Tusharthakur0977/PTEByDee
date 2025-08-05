import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';

/**
 * @desc    Delete user (Admin only)
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

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
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        courses: true,
        testAttempts: true,
        transactions: true,
      },
    });

    if (!user) {
      return sendResponse(res, STATUS_CODES.NOT_FOUND, null, 'User not found.');
    }

    // Check if user has active enrollments or transactions
    if (user.courses.length > 0 || user.transactions.length > 0) {
      return sendResponse(
        res,
        STATUS_CODES.CONFLICT,
        null,
        'Cannot delete user with active enrollments or transactions. Please transfer or complete them first.'
      );
    }

    // Perform deletion in transaction
    await prisma.$transaction(async (tx) => {
      // Delete user progress records
      await tx.userLessonProgress.deleteMany({
        where: { userId: id },
      });

      await tx.userSectionProgress.deleteMany({
        where: { userId: id },
      });

      // Delete test attempts and responses
      const testAttemptIds = user.testAttempts.map((ta) => ta.id);
      if (testAttemptIds.length > 0) {
        await tx.userResponse.deleteMany({
          where: {
            testAttemptId: {
              in: testAttemptIds,
            },
          },
        });

        await tx.aIReport.deleteMany({
          where: {
            testAttemptId: {
              in: testAttemptIds,
            },
          },
        });

        await tx.testAttempt.deleteMany({
          where: { userId: id },
        });
      }

      // Delete notifications
      await tx.notification.deleteMany({
        where: { userId: id },
      });

      // Delete OTP codes
      await tx.otpCode.deleteMany({
        where: { userId: id },
      });

      // Finally delete the user
      await tx.user.delete({
        where: { id },
      });
    });

    return sendResponse(
      res,
      STATUS_CODES.OK,
      {
        userId: id,
        userName: user.name,
        userEmail: user.email,
      },
      `User "${user.name}" deleted successfully.`
    );
  } catch (error: any) {
    console.error('Delete user error:', error);

    if (error.code === 'P2025') {
      return sendResponse(res, STATUS_CODES.NOT_FOUND, null, 'User not found.');
    }

    return sendResponse(
      res,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      null,
      'An error occurred while deleting the user. Please try again.'
    );
  }
});
