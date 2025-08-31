import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import stripe from '../../config/stripeConfig';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';

/**
 * @desc    Get all transactions with filtering and pagination (Admin only)
 * @route   GET /api/admin/payments/transactions
 * @access  Private/Admin
 */
export const getAllTransactions = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const {
        page = '1',
        limit = '10',
        search = '',
        status,
        gateway,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);
      const skip = (pageNumber - 1) * limitNumber;

      // Build where clause for filtering
      const whereClause: any = {};

      // Search functionality
      if (search) {
        whereClause.OR = [
          {
            purchasedItem: {
              contains: search as string,
              mode: 'insensitive',
            },
          },
          {
            transactionId: {
              contains: search as string,
              mode: 'insensitive',
            },
          },
          {
            user: {
              OR: [
                {
                  name: {
                    contains: search as string,
                    mode: 'insensitive',
                  },
                },
                {
                  email: {
                    contains: search as string,
                    mode: 'insensitive',
                  },
                },
              ],
            },
          },
        ];
      }

      // Filter by status
      if (status) {
        whereClause.paymentStatus = status;
      }

      // Filter by gateway
      if (gateway) {
        whereClause.gateway = gateway;
      }

      // Build orderBy clause
      const orderBy: any = {};
      orderBy[sortBy as string] = sortOrder as 'asc' | 'desc';

      // Get total count for pagination
      const totalTransactions = await prisma.transaction.count({
        where: whereClause,
      });

      // Get transactions with user info
      const transactions = await prisma.transaction.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePictureUrl: true,
            },
          },
        },
        orderBy,
        skip,
        take: limitNumber,
      });

      // Calculate pagination info
      const totalPages = Math.ceil(totalTransactions / limitNumber);
      const hasNextPage = pageNumber < totalPages;
      const hasPrevPage = pageNumber > 1;

      const responseData = {
        transactions,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalTransactions,
          hasNextPage,
          hasPrevPage,
          limit: limitNumber,
        },
        filters: {
          search: search as string,
          status: status as string,
          gateway: gateway as string,
          sortBy: sortBy as string,
          sortOrder: sortOrder as string,
        },
      };

      return sendResponse(
        res,
        STATUS_CODES.OK,
        responseData,
        `Retrieved ${transactions.length} transactions successfully.`
      );
    } catch (error: any) {
      console.error('Get all transactions error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while fetching transactions. Please try again.'
      );
    }
  }
);

/**
 * @desc    Get payment statistics (Admin only)
 * @route   GET /api/admin/payments/stats
 * @access  Private/Admin
 */
export const getPaymentStats = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Get basic transaction counts
      const [
        totalTransactions,
        successfulTransactions,
        pendingTransactions,
        failedTransactions,
      ] = await Promise.all([
        prisma.transaction.count(),
        prisma.transaction.count({ where: { paymentStatus: 'SUCCESS' } }),
        prisma.transaction.count({ where: { paymentStatus: 'PENDING' } }),
        prisma.transaction.count({ where: { paymentStatus: 'FAILED' } }),
      ]);

      // Get revenue statistics
      const revenueStats = await prisma.transaction.aggregate({
        where: {
          paymentStatus: 'SUCCESS',
        },
        _sum: {
          amount: true,
        },
        _avg: {
          amount: true,
        },
      });

      // Get this month's statistics
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [revenueThisMonth, transactionsThisMonth] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            paymentStatus: 'SUCCESS',
            createdAt: {
              gte: startOfMonth,
            },
          },
          _sum: {
            amount: true,
          },
        }),
        prisma.transaction.count({
          where: {
            createdAt: {
              gte: startOfMonth,
            },
          },
        }),
      ]);

      const stats = {
        totalRevenue: revenueStats._sum.amount || 0,
        totalTransactions,
        successfulTransactions,
        pendingTransactions,
        failedTransactions,
        averageOrderValue: revenueStats._avg.amount || 0,
        revenueThisMonth: revenueThisMonth._sum.amount || 0,
        transactionsThisMonth,
        successRate:
          totalTransactions > 0
            ? (successfulTransactions / totalTransactions) * 100
            : 0,
      };

      return sendResponse(
        res,
        STATUS_CODES.OK,
        stats,
        'Payment statistics retrieved successfully.'
      );
    } catch (error: any) {
      console.error('Get payment stats error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while fetching payment statistics. Please try again.'
      );
    }
  }
);

/**
 * @desc    Get transaction by ID (Admin only)
 * @route   GET /api/admin/payments/transactions/:id
 * @access  Private/Admin
 */
export const getTransactionById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      // Validate ObjectId format
      if (!id || id.length !== 24) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Invalid transaction ID format.'
        );
      }

      const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePictureUrl: true,
              createdAt: true,
            },
          },
        },
      });

      if (!transaction) {
        return sendResponse(
          res,
          STATUS_CODES.NOT_FOUND,
          null,
          'Transaction not found.'
        );
      }

      // Get Stripe payment details if available
      let stripeDetails = null;
      if (transaction.transactionId && transaction.gateway === 'Stripe') {
        try {
          if (transaction.transactionId.startsWith('cs_')) {
            // Checkout session
            stripeDetails = await stripe.checkout.sessions.retrieve(
              transaction.transactionId
            );
          } else if (transaction.transactionId.startsWith('pi_')) {
            // Payment intent
            stripeDetails = await stripe.paymentIntents.retrieve(
              transaction.transactionId
            );
          }
        } catch (error) {
          console.warn('Failed to retrieve Stripe details:', error);
        }
      }

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          transaction,
          stripeDetails,
        },
        'Transaction details retrieved successfully.'
      );
    } catch (error: any) {
      console.error('Get transaction by ID error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while fetching transaction details. Please try again.'
      );
    }
  }
);

/**
 * @desc    Refund transaction (Admin only)
 * @route   POST /api/admin/payments/transactions/:id/refund
 * @access  Private/Admin
 */
export const refundTransaction = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    try {
      // Validate ObjectId format
      if (!id || id.length !== 24) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Invalid transaction ID format.'
        );
      }

      const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!transaction) {
        return sendResponse(
          res,
          STATUS_CODES.NOT_FOUND,
          null,
          'Transaction not found.'
        );
      }

      if (transaction.paymentStatus === 'REFUNDED') {
        return sendResponse(
          res,
          STATUS_CODES.CONFLICT,
          null,
          'Transaction has already been refunded.'
        );
      }

      if (transaction.paymentStatus !== 'SUCCESS') {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Only successful transactions can be refunded.'
        );
      }

      // Process refund with Stripe
      let stripeRefund = null;
      if (transaction.transactionId && transaction.gateway === 'Stripe') {
        try {
          if (transaction.transactionId.startsWith('pi_')) {
            // Refund payment intent
            stripeRefund = await stripe.refunds.create({
              payment_intent: transaction.transactionId,
              reason: 'requested_by_customer',
              metadata: {
                admin_reason: reason || 'Admin refund',
                original_transaction_id: transaction.id,
              },
            });
          } else if (transaction.transactionId.startsWith('cs_')) {
            // Get payment intent from checkout session and refund
            const session = await stripe.checkout.sessions.retrieve(
              transaction.transactionId,
              { expand: ['payment_intent'] }
            );

            if (
              session.payment_intent &&
              typeof session.payment_intent === 'object'
            ) {
              stripeRefund = await stripe.refunds.create({
                payment_intent: session.payment_intent.id,
                reason: 'requested_by_customer',
                metadata: {
                  admin_reason: reason || 'Admin refund',
                  original_transaction_id: transaction.id,
                },
              });
            }
          }
        } catch (stripeError) {
          console.error('Stripe refund error:', stripeError);
          return sendResponse(
            res,
            STATUS_CODES.INTERNAL_SERVER_ERROR,
            null,
            'Failed to process refund with Stripe. Please try again.'
          );
        }
      }

      // Update transaction status
      const updatedTransaction = await prisma.transaction.update({
        where: { id },
        data: {
          paymentStatus: 'REFUNDED',
        },
      });

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          transaction: updatedTransaction,
          stripeRefund,
          refundAmount: transaction.amount,
        },
        `Refund of $${transaction.amount} processed successfully.`
      );
    } catch (error: any) {
      console.error('Refund transaction error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while processing the refund. Please try again.'
      );
    }
  }
);
