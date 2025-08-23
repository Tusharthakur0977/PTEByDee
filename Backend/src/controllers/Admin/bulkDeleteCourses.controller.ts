import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { StripeProductService } from '../../services/stripeProductService';

/**
 * @desc    Bulk delete multiple courses (Admin only)
 * @route   DELETE /api/admin/courses/bulk
 * @access  Private/Admin
 */
export const bulkDeleteCourses = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseIds } = req.body;

    try {
      // Input validation
      if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Course IDs array is required and cannot be empty.'
        );
      }

      // Validate ObjectId format for all IDs
      const invalidIds = courseIds.filter((id) => !id || id.length !== 24);
      if (invalidIds.length > 0) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          `Invalid course ID format for: ${invalidIds.join(', ')}`
        );
      }

      // Check which courses exist and have active enrollments
      const courses = await prisma.course.findMany({
        where: {
          id: {
            in: courseIds,
          },
        },
        include: {
          userCourses: {
            where: {
              completed: false,
            },
          },
          sections: {
            include: {
              lessons: true,
            },
          },
          reviews: true,
        },
      });

      if (courses.length === 0) {
        return sendResponse(
          res,
          STATUS_CODES.NOT_FOUND,
          null,
          'No courses found with the provided IDs.'
        );
      }

      // Check for courses with active enrollments
      const coursesWithActiveEnrollments = courses.filter(
        (course) => course.userCourses.length > 0
      );

      if (coursesWithActiveEnrollments.length > 0) {
        const courseNames = coursesWithActiveEnrollments.map((c) => c.title);
        return sendResponse(
          res,
          STATUS_CODES.CONFLICT,
          null,
          `Cannot delete courses with active enrollments: ${courseNames.join(
            ', '
          )}`
        );
      }

      // Perform bulk deletion
      const deletionResults = await prisma.$transaction(async (tx) => {
        const results = [];

        for (const course of courses) {
          // Archive Stripe product if it exists
          if (course.stripeProductId) {
            try {
              await StripeProductService.archiveProduct(course.stripeProductId);
            } catch (error) {
              console.warn(
                `Failed to archive Stripe product for course ${course.id}:`,
                error
              );
              // Don't fail the deletion for this
            }
          }

          // Delete lesson resources
          const lessonIds = course.sections.flatMap((section) =>
            section.lessons.map((lesson) => lesson.id)
          );

          if (lessonIds.length > 0) {
            await tx.lessonResource.deleteMany({
              where: {
                lessonId: {
                  in: lessonIds,
                },
              },
            });

            await tx.userLessonProgress.deleteMany({
              where: {
                lessonId: {
                  in: lessonIds,
                },
              },
            });

            await tx.lesson.deleteMany({
              where: {
                id: {
                  in: lessonIds,
                },
              },
            });
          }

          // Delete sections
          const sectionIds = course.sections.map((section) => section.id);
          if (sectionIds.length > 0) {
            await tx.courseSection.deleteMany({
              where: {
                id: {
                  in: sectionIds,
                },
              },
            });
          }

          // Delete reviews and enrollments
          await tx.courseReview.deleteMany({
            where: {
              courseId: course.id,
            },
          });

          await tx.userCourse.deleteMany({
            where: {
              courseId: course.id,
            },
          });

          // Delete the course
          await tx.course.delete({
            where: { id: course.id },
          });

          results.push({
            courseId: course.id,
            courseTitle: course.title,
            deletedSections: sectionIds.length,
            deletedLessons: lessonIds.length,
            deletedReviews: course.reviews.length,
          });
        }

        return results;
      });

      const summary = {
        totalCoursesDeleted: deletionResults.length,
        totalSectionsDeleted: deletionResults.reduce(
          (sum, r) => sum + r.deletedSections,
          0
        ),
        totalLessonsDeleted: deletionResults.reduce(
          (sum, r) => sum + r.deletedLessons,
          0
        ),
        totalReviewsDeleted: deletionResults.reduce(
          (sum, r) => sum + r.deletedReviews,
          0
        ),
        deletedCourses: deletionResults.map((r) => ({
          id: r.courseId,
          title: r.courseTitle,
        })),
      };

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          summary,
          details: deletionResults,
        },
        `Successfully deleted ${deletionResults.length} courses and all related data.`
      );
    } catch (error: any) {
      console.error('Bulk delete courses error:', error);

      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while deleting courses. Please try again.'
      );
    }
  }
);
