import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';

/**
 * @desc    Get all tests for question assignment
 * @route   GET /api/admin/tests
 * @access  Private/Admin
 */
export const getTests = asyncHandler(async (req: Request, res: Response) => {
  try {
    const tests = await prisma.test.findMany({
      include: {
        _count: {
          select: {
            questions: true,
            testAttempts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendResponse(
      res,
      STATUS_CODES.OK,
      tests,
      'Tests retrieved successfully.'
    );
  } catch (error: any) {
    console.error('Get tests error:', error);
    return sendResponse(
      res,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      null,
      'An error occurred while fetching tests. Please try again.'
    );
  }
});
