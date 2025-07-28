import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { CustomRequest } from '../../types';

/**
 * @desc    Enroll user in a course
 * @route   POST /api/user/courses/:id/enroll
 * @access  Private (requires authentication)
 */
export const enrollCourse = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { id: courseId } = req.params;
    const userId = req.user?.id;

    try {
      if (!userId) {
        return sendResponse(
          res,
          STATUS_CODES.UNAUTHORIZED,
          null,
          'Authentication required to enroll in courses.'
        );
      }

      // Validate ObjectId format
      if (!courseId || courseId.length !== 24) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Invalid course ID format.'
        );
      }

      // Check if course exists and get full details
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          isFree: true,
          price: true,
          currency: true,
          averageRating: true,
          reviewCount: true,
          sections: {
            select: {
              id: true,
              title: true,
              order: true,
              lessons: {
                select: {
                  id: true,
                  title: true,
                  order: true,
                },
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              userCourses: true,
              sections: true,
            },
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

      // Check if user is already enrolled
      const existingEnrollment = await prisma.userCourse.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
        select: {
          id: true,
          progress: true,
          completed: true,
          enrolledAt: true,
          completedAt: true,
        },
      });

      if (existingEnrollment) {
        return sendResponse(
          res,
          STATUS_CODES.CONFLICT,
          {
            enrollment: existingEnrollment,
            course: {
              id: course.id,
              title: course.title,
              description: course.description,
              imageUrl: course.imageUrl,
              isFree: course.isFree,
              price: course.price,
              currency: course.currency,
              averageRating: course.averageRating,
              reviewCount: course.reviewCount,
              enrollmentCount: course._count.userCourses,
              sectionCount: course._count.sections,
            },
            message: 'Already enrolled',
          },
          `You are already enrolled in "${course.title}". Continue your learning journey!`
        );
      }

      // For paid courses, check payment status
      if (!course.isFree) {
        // TODO: Implement payment verification
        // For now, we'll allow enrollment but you should add payment logic here
        console.log(
          `Payment required for course: ${course.title} - $${course.price}`
        );

        // Uncomment this when payment is implemented
        // return sendResponse(
        //   res,
        //   STATUS_CODES.PAYMENT_REQUIRED,
        //   {
        //     course: {
        //       id: course.id,
        //       title: course.title,
        //       price: course.price,
        //       currency: course.currency,
        //     },
        //     paymentRequired: true,
        //   },
        //   'Payment required for this course. Please complete payment to enroll.'
        // );
      }

      // Create enrollment
      const enrollment = await prisma.userCourse.create({
        data: {
          userId,
          courseId,
          progress: 0.0,
          completed: false,
          enrolledAt: new Date(),
        },
      });

      // Get user info for response
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      return sendResponse(
        res,
        STATUS_CODES.CREATED,
        {
          enrollment: {
            id: enrollment.id,
            progress: enrollment.progress,
            completed: enrollment.completed,
            enrolledAt: enrollment.enrolledAt,
            completedAt: enrollment.completedAt,
          },
          course: {
            id: course.id,
            title: course.title,
            description: course.description,
            imageUrl: course.imageUrl,
            isFree: course.isFree,
            price: course.price,
            currency: course.currency,
            averageRating: course.averageRating,
            reviewCount: course.reviewCount,
            enrollmentCount: course._count.userCourses + 1, // Include the new enrollment
            sectionCount: course._count.sections,
            sections: course.sections,
          },
          user: user,
          isNewEnrollment: true,
        },
        `Successfully enrolled in "${course.title}". Start learning now!`
      );
    } catch (error: any) {
      console.error('Enroll course error:', error);

      // Handle specific Prisma errors
      if (error.code === 'P2002') {
        // Unique constraint violation (shouldn't happen due to our check, but just in case)
        return sendResponse(
          res,
          STATUS_CODES.CONFLICT,
          null,
          'You are already enrolled in this course.'
        );
      }

      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while enrolling in the course. Please try again.'
      );
    }
  }
);
