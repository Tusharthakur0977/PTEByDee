import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';

/**
 * @desc    Delete a course and all related data (Admin only)
 * @route   DELETE /api/admin/courses/:id
 * @access  Private/Admin
 */
export const deleteCourse = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      // Validate ObjectId format
      if (!id || id.length !== 24) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Invalid course ID format.'
        );
      }

      // Check if course exists and get related data count
      const course = await prisma.course.findUnique({
        where: { id },
        include: {
          sections: {
            include: {
              lessons: {
                include: {
                  UserLessonProgress: true,
                  LessonResource: true,
                },
              },
            },
          },
          userCourses: true,
          reviews: true,
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

      // Check if course has active enrollments
      const activeEnrollments = course.userCourses.filter(
        (enrollment) => !enrollment.completed
      );

      if (activeEnrollments.length > 0) {
        return sendResponse(
          res,
          STATUS_CODES.CONFLICT,
          null,
          `Cannot delete course with ${activeEnrollments.length} active enrollments. Please complete or transfer enrollments first.`
        );
      }

      // Perform soft delete or hard delete based on business logic
      // For this implementation, we'll do a hard delete with proper cascade
      const deletionResult = await prisma.$transaction(async (tx) => {
        // Delete lesson resources first
        const lessonIds = course.sections.flatMap(section => 
          section.lessons.map(lesson => lesson.id)
        );

        if (lessonIds.length > 0) {
          await tx.lessonResource.deleteMany({
            where: {
              lessonId: {
                in: lessonIds,
              },
            },
          });

          // Delete user lesson progress
          await tx.userLessonProgress.deleteMany({
            where: {
              lessonId: {
                in: lessonIds,
              },
            },
          });

          // Delete lessons
          await tx.lesson.deleteMany({
            where: {
              id: {
                in: lessonIds,
              },
            },
          });
        }

        // Delete sections
        const sectionIds = course.sections.map(section => section.id);
        if (sectionIds.length > 0) {
          await tx.courseSection.deleteMany({
            where: {
              id: {
                in: sectionIds,
              },
            },
          });
        }

        // Delete course reviews
        await tx.courseReview.deleteMany({
          where: {
            courseId: id,
          },
        });

        // Delete user course enrollments
        await tx.userCourse.deleteMany({
          where: {
            courseId: id,
          },
        });

        // Finally, delete the course
        const deletedCourse = await tx.course.delete({
          where: { id },
        });

        return {
          deletedCourse,
          deletedSections: sectionIds.length,
          deletedLessons: lessonIds.length,
          deletedEnrollments: course.userCourses.length,
          deletedReviews: course.reviews.length,
        };
      });

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          courseId: id,
          courseTitle: course.title,
          deletionSummary: {
            sections: deletionResult.deletedSections,
            lessons: deletionResult.deletedLessons,
            enrollments: deletionResult.deletedEnrollments,
            reviews: deletionResult.deletedReviews,
          },
        },
        `Course "${course.title}" and all related data deleted successfully.`
      );
    } catch (error: any) {
      console.error('Delete course error:', error);
      
      // Handle Prisma specific errors
      if (error.code === 'P2025') {
        return sendResponse(
          res,
          STATUS_CODES.NOT_FOUND,
          null,
          'Course not found.'
        );
      }

      // Handle foreign key constraint errors
      if (error.code === 'P2003') {
        return sendResponse(
          res,
          STATUS_CODES.CONFLICT,
          null,
          'Cannot delete course due to existing dependencies. Please remove all related data first.'
        );
      }

      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while deleting the course. Please try again.'
      );
    }
  }
);