import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import stripe from '../../config/stripeConfig';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { CustomRequest } from '../../types';

/**
 * @desc    Confirm payment and enroll user in course
 * @route   POST /api/payment/confirm
 * @access  Private (requires authentication)
 */
export const confirmPayment = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { paymentIntentId } = req.body;
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

      if (!paymentIntentId) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Payment intent ID is required.'
        );
      }

      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );

      if (paymentIntent.status !== 'succeeded') {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Payment has not been completed successfully.'
        );
      }

      // Verify the payment belongs to the current user
      if (paymentIntent.metadata.userId !== userId) {
        return sendResponse(
          res,
          STATUS_CODES.FORBIDDEN,
          null,
          'Payment does not belong to the current user.'
        );
      }

      const courseId = paymentIntent.metadata.courseId;

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
          null,
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
        const transaction = await tx.transaction.updateMany({
          where: {
            transactionId: paymentIntentId,
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

        return { transaction, enrollment };
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
            paymentIntentId,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency.toUpperCase(),
            status: paymentIntent.status,
          },
        },
        `Payment successful! You are now enrolled in "${course.title}".`
      );
    } catch (error: any) {
      console.error('Confirm payment error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while confirming payment. Please try again.'
      );
    }
  }
);
