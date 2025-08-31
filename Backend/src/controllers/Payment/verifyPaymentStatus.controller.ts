import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { StripeCheckoutService } from '../../services/stripeCheckoutService';
import { CustomRequest } from '../../types';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';

/**
 * @desc    Verify payment status by session ID
 * @route   GET /api/payment/verify-status/:sessionId
 * @access  Private (requires authentication)
 */
export const verifyPaymentStatus = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    try {
      if (!userId) {
        return sendResponse(
          res,
          STATUS_CODES.UNAUTHORIZED,
          null,
          'Authentication required.'
        );
      }

      if (!sessionId) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Session ID is required.'
        );
      }

      // Retrieve checkout session from Stripe
      const session = await StripeCheckoutService.retrieveSession(sessionId);

      // Verify the session belongs to the current user
      if (session.metadata?.userId !== userId) {
        return sendResponse(
          res,
          STATUS_CODES.FORBIDDEN,
          null,
          'Session does not belong to the current user.'
        );
      }

      const courseId = session.metadata?.courseId;

      // Check enrollment status
      let enrollment = null;
      if (courseId) {
        enrollment = await prisma.userCourse.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId,
            },
          },
        });
      }

      // Check transaction status
      const transaction = await prisma.transaction.findFirst({
        where: {
          OR: [{ transactionId: sessionId }, { orderId: sessionId }],
          userId: userId,
        },
      });

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          sessionId,
          paymentStatus: session.payment_status,
          isEnrolled: !!enrollment,
          enrollment,
          transaction,
          course: {
            id: courseId,
            title: session.metadata?.courseTitle,
          },
          paymentDetails: {
            amount: session.amount_total ? session.amount_total / 100 : 0,
            currency: session.currency?.toUpperCase() || 'USD',
            status: session.payment_status,
          },
        },
        'Payment status retrieved successfully.'
      );
    } catch (error: any) {
      console.error('Verify payment status error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while verifying payment status. Please try again.'
      );
    }
  }
);
