import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { StripeCheckoutService } from '../../services/stripeCheckoutService';
import { CustomRequest } from '../../types';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';

/**
 * @desc    Confirm checkout session and enroll user in course
 * @route   POST /api/payment/confirm-checkout
 * @access  Private (requires authentication)
 */
export const confirmCheckoutSession = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { sessionId } = req.body;
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
          'Checkout session ID is required.'
        );
      }

      // Retrieve checkout session from Stripe
      const session = await StripeCheckoutService.retrieveSession(sessionId);

      if (session.payment_status !== 'paid') {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Payment has not been completed successfully.'
        );
      }

      // Verify the session belongs to the current user
      if (session.metadata?.userId !== userId) {
        return sendResponse(
          res,
          STATUS_CODES.FORBIDDEN,
          null,
          'Checkout session does not belong to the current user.'
        );
      }

      const courseId = session.metadata?.courseId;

      if (!courseId) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Course information not found in checkout session.'
        );
      }

      // Check if user is already enrolled
      const existingEnrollment = await prisma.userCourse.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
      });

      if (existingEnrollment) {
        return sendResponse(
          res,
          STATUS_CODES.CONFLICT,
          {
            enrollment: existingEnrollment,
            alreadyEnrolled: true,
          },
          'You are already enrolled in this course.'
        );
      }

      // Get course details
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          sections: {
            include: {
              lessons: {
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!course) {
        return sendResponse(
          res,
          STATUS_CODES.NOT_FOUND,
          null,
          'Course not found.'
        );
      }

      // Process enrollment and update transaction in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update transaction status
        await tx.transaction.updateMany({
          where: {
            transactionId: sessionId,
            userId: userId,
          },
          data: {
            paymentStatus: 'SUCCESS',
          },
        });

        // Create enrollment
        const enrollment = await tx.userCourse.create({
          data: {
            userId,
            courseId,
            progress: 0.0,
            completed: false,
            enrolledAt: new Date(),
          },
        });

        return { enrollment };
      });

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          enrollment: result.enrollment,
          course: {
            id: course.id,
            title: course.title,
            description: course.description,
            imageUrl: course.imageUrl,
            sectionCount: course.sections.length,
          },
          paymentDetails: {
            sessionId,
            amount: session.amount_total ? session.amount_total / 100 : 0,
            currency: session.currency?.toUpperCase(),
            status: session.payment_status,
          },
        },
        `Payment successful! You are now enrolled in "${course.title}".`
      );
    } catch (error: any) {
      console.error('Confirm checkout session error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while confirming payment. Please try again.'
      );
    }
  }
);
