import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';

/**
 * @desc    Get user by ID with detailed information (Admin only)
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
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

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        provider: true,
        isVerified: true,
        profilePictureUrl: true,
        googleId: true,
        createdAt: true,
        updatedAt: true,
        courses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
                isFree: true,
                price: true,
              },
            },
          },
          orderBy: { enrolledAt: 'desc' },
        },
        testAttempts: {
          select: {
            id: true,
            overallScore: true,
            completedAt: true,
            test: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
        transactions: {
          select: {
            id: true,
            amount: true,
            paymentStatus: true,
            purchasedItem: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        subscription: {
          select: {
            id: true,
            planName: true,
            startDate: true,
            endDate: true,
            isTrial: true,
          },
        },
        _count: {
          select: {
            courses: true,
            testAttempts: true,
            transactions: true,
            notifications: true,
          },
        },
      },
    });

    if (!user) {
      return sendResponse(res, STATUS_CODES.NOT_FOUND, null, 'User not found.');
    }

    // Calculate additional statistics
    const stats = {
      totalEnrollments: user._count.courses,
      completedCourses: user.courses.filter((c) => c.completed).length,
      totalTestAttempts: user._count.testAttempts,
      averageTestScore:
        user.testAttempts.length > 0
          ? user.testAttempts
              .filter((ta) => ta.overallScore)
              .reduce((sum, ta) => sum + (ta.overallScore || 0), 0) /
            user.testAttempts.filter((ta) => ta.overallScore).length
          : 0,
      totalTransactions: user._count.transactions,
      totalSpent: user.transactions.reduce((sum, t) => sum + t.amount, 0),
    };

    const responseData = {
      ...user,
      stats,
    };

    return sendResponse(
      res,
      STATUS_CODES.OK,
      responseData,
      'User details retrieved successfully.'
    );
  } catch (error: any) {
    console.error('Get user by ID error:', error);

    if (error.code === 'P2025') {
      return sendResponse(res, STATUS_CODES.NOT_FOUND, null, 'User not found.');
    }

    return sendResponse(
      res,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      null,
      'An error occurred while fetching user details. Please try again.'
    );
  }
});
