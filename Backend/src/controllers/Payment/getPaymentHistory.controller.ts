import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { CustomRequest } from '../../types';

/**
 * @desc    Get user's payment history
 * @route   GET /api/payment/history
 * @access  Private (requires authentication)
 */
export const getPaymentHistory = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?.id;
    const { page = '1', limit = '10' } = req.query;

    try {
      if (!userId) {
        return sendResponse(
          res,
          STATUS_CODES.UNAUTHORIZED,
          null,
          'Authentication required to view payment history.'
        );
      }

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);
      const skip = (pageNumber - 1) * limitNumber;

      // Get total count
      const totalTransactions = await prisma.transaction.count({
        where: { userId },
      });

      // Get transactions with pagination
      const transactions = await prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNumber,
      });

      // Calculate pagination info
      const totalPages = Math.ceil(totalTransactions / limitNumber);
      const hasNextPage = pageNumber < totalPages;
      const hasPrevPage = pageNumber > 1;

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          transactions,
          pagination: {
            currentPage: pageNumber,
            totalPages,
            totalTransactions,
            hasNextPage,
            hasPrevPage,
            limit: limitNumber,
          },
        },
        'Payment history retrieved successfully.'
      );
    } catch (error: any) {
      console.error('Get payment history error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while fetching payment history. Please try again.'
      );
    }
  }
);
