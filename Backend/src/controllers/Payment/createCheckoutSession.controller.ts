import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { CustomRequest } from '../../types';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { StripeCheckoutService } from '../../services/stripeCheckoutService';

/**
 * @desc    Create checkout session for course purchase
 * @route   POST /api/payment/create-checkout-session
 * @access  Private (requires authentication)
 */
export const createCheckoutSession = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { courseId } = req.body;
    const userId = req.user?.id;

    try {
      if (!userId) {
        return sendResponse(
          res,
          STATUS_CODES.UNAUTHORIZED,
          null,
          'Authentication required to purchase courses.'
        );
      }

      // Validate course ID
      if (!courseId || courseId.length !== 24) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Invalid course ID format.'
        );
      }

      // Get course details
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          currency: true,
          isFree: true,
          stripeProductId: true,
          stripePriceId: true,
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

      if (course.isFree) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'This course is free and does not require payment.'
        );
      }

      if (!course.price || course.price <= 0) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Course price is not set properly.'
        );
      }

      if (!course.stripeProductId || !course.stripePriceId) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Course is not properly configured for payments. Please contact support.'
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
          null,
          'You are already enrolled in this course.'
        );
      }

      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      if (!user) {
        return sendResponse(
          res,
          STATUS_CODES.NOT_FOUND,
          null,
          'User not found.'
        );
      }

      // Create checkout session
      const checkoutData = await StripeCheckoutService.createCheckoutSession({
        courseId: course.id,
        userId: user.id,
        userEmail: user.email,
        priceId: course.stripePriceId,
      });

      return sendResponse(
        res,
        STATUS_CODES.CREATED,
        {
          sessionId: checkoutData.sessionId,
          sessionUrl: checkoutData.sessionUrl,
          transactionId: checkoutData.transactionId,
          course: {
            id: course.id,
            title: course.title,
            price: course.price,
            currency: course.currency,
          },
        },
        'Checkout session created successfully.'
      );
    } catch (error: any) {
      console.error('Create checkout session error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while creating checkout session. Please try again.'
      );
    }
  }
);
