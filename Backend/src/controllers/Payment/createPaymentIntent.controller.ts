import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import stripe from '../../config/stripeConfig';
import { CustomRequest } from '../../types';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';

/**
 * @desc    Create payment intent for course purchase
 * @route   POST /api/payment/create-intent
 * @access  Private (requires authentication)
 */
export const createPaymentIntent = asyncHandler(
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
          price: true,
          currency: true,
          isFree: true,
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

      // Get user details for payment
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

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(course.price * 100), // Convert to cents
        currency: course.currency?.toLowerCase() || 'usd',
        metadata: {
          courseId: course.id,
          userId: user.id,
          courseTitle: course.title,
          userEmail: user.email,
        },
        description: `Purchase of course: ${course.title}`,
        receipt_email: user.email,
      });

      // Create transaction record
      const transaction = await prisma.transaction.create({
        data: {
          userId: user.id,
          amount: course.price,
          paymentStatus: 'PENDING',
          gateway: 'Stripe',
          transactionId: paymentIntent.id,
          purchasedItem: `${course.title} (${course.id})`,
        },
      });

      return sendResponse(
        res,
        STATUS_CODES.CREATED,
        {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          transactionId: transaction.id,
          amount: course.price,
          currency: course.currency || 'USD',
          course: {
            id: course.id,
            title: course.title,
            price: course.price,
          },
        },
        'Payment intent created successfully.'
      );
    } catch (error: any) {
      console.error('Create payment intent error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while creating payment intent. Please try again.'
      );
    }
  }
);
