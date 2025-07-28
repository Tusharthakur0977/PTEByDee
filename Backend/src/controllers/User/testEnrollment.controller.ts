import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { CustomRequest } from '../../types';

/**
 * @desc    Test endpoint to check enrollments and create test enrollment
 * @route   GET /api/user/test-enrollment
 * @access  Private (requires authentication)
 */
export const testEnrollment = asyncHandler(
  async (req: CustomRequest, res: Response) => {
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

      console.log('Test Enrollment - User ID:', userId);

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      console.log('Test Enrollment - User found:', user);

      // Get all courses
      const allCourses = await prisma.course.findMany({
        select: {
          id: true,
          title: true,
          isFree: true,
        },
        take: 5,
      });

      console.log('Test Enrollment - Available courses:', allCourses);

      // Check existing enrollments for this user
      const existingEnrollments = await prisma.userCourse.findMany({
        where: {
          userId: userId,
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      console.log('Test Enrollment - Existing enrollments:', existingEnrollments);

      // If no enrollments exist and there are courses, create a test enrollment
      let testEnrollment = null;
      if (existingEnrollments.length === 0 && allCourses.length > 0) {
        const firstCourse = allCourses[0];
        console.log('Test Enrollment - Creating test enrollment for course:', firstCourse);

        testEnrollment = await prisma.userCourse.create({
          data: {
            userId: userId,
            courseId: firstCourse.id,
            progress: 25.0,
            completed: false,
          },
          include: {
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        });

        console.log('Test Enrollment - Created test enrollment:', testEnrollment);
      }

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          user,
          allCourses,
          existingEnrollments,
          testEnrollment,
          message: testEnrollment 
            ? 'Test enrollment created successfully'
            : existingEnrollments.length > 0 
              ? 'User already has enrollments'
              : 'No courses available for enrollment',
        },
        'Test enrollment check completed.'
      );
    } catch (error: any) {
      console.error('Test enrollment error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred during test enrollment check.'
      );
    }
  }
);
