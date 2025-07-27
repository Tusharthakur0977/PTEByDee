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

      // Check if course exists
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          title: true,
          isFree: true,
          price: true,
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
      });

      if (existingEnrollment) {
        return sendResponse(
          res,
          STATUS_CODES.CONFLICT,
          null,
          'You are already enrolled in this course.'
        );
      }

      // For paid courses, you would typically check payment status here
      // For now, we'll allow enrollment in all courses
      if (!course.isFree) {
        // TODO: Implement payment verification
        // For now, we'll return an error for paid courses
        return sendResponse(
          res,
          STATUS_CODES.PAYMENT_REQUIRED,
          null,
          'Payment required for this course. Payment integration coming soon.'
        );
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
        include: {
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              imageUrl: true,
              isFree: true,
              price: true,
            },
          },
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
          },
          course: enrollment.course,
        },
        `Successfully enrolled in "${course.title}".`
      );
    } catch (error: any) {
      console.error('Enroll course error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while enrolling in the course. Please try again.'
      );
    }
  }
);
