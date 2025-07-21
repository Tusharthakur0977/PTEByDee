import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';

/**
 * @desc    Get a single course by ID with complete details (Admin only)
 * @route   GET /api/admin/courses/:id
 * @access  Private/Admin
 */
export const getCourseById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      // Validate ObjectId format (basic check)
      if (!id || id.length !== 24) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Invalid course ID format.'
        );
      }

      const course = await prisma.course.findUnique({
        where: { id },
        include: {
          sections: {
            include: {
              lessons: {
                include: {
                  UserLessonProgress: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          name: true,
                          email: true,
                        },
                      },
                    },
                  },
                  LessonResource: true,
                },
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
          reviews: {
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
            orderBy: { createdAt: 'desc' },
          },
          userCourses: {
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
            orderBy: { enrolledAt: 'desc' },
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

      // Calculate additional statistics
      const stats = {
        totalSections: course.sections.length,
        totalLessons: course.sections.reduce(
          (total, section) => total + section.lessons.length,
          0
        ),
        totalEnrollments: course.userCourses.length,
        completedEnrollments: course.userCourses.filter(
          (enrollment) => enrollment.completed
        ).length,
        averageProgress: course.userCourses.length > 0 
          ? course.userCourses.reduce((sum, enrollment) => sum + enrollment.progress, 0) / course.userCourses.length
          : 0,
        totalResources: course.sections.reduce(
          (total, section) => 
            total + section.lessons.reduce(
              (lessonTotal, lesson) => lessonTotal + lesson.LessonResource.length,
              0
            ),
          0
        ),
      };

      const responseData = {
        ...course,
        stats,
      };

      return sendResponse(
        res,
        STATUS_CODES.OK,
        responseData,
        'Course retrieved successfully.'
      );
    } catch (error: any) {
      console.error('Get course by ID error:', error);
      
      // Handle Prisma specific errors
      if (error.code === 'P2025') {
        return sendResponse(
          res,
          STATUS_CODES.NOT_FOUND,
          null,
          'Course not found.'
        );
      }

      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while fetching the course. Please try again.'
      );
    }
  }
);