import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { CustomRequest } from '../../types';

/**
 * @desc    Get user's progress for a specific course
 * @route   GET /api/user/courses/:courseId/progress
 * @access  Private (requires authentication)
 */
export const getUserProgress = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { courseId } = req.params;
    const userId = req.user?.id;

    try {
      if (!userId) {
        return sendResponse(
          res,
          STATUS_CODES.UNAUTHORIZED,
          null,
          'Authentication required to view progress.'
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

      // Check if user is enrolled in the course
      const enrollment = await prisma.userCourse.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
      });

      if (!enrollment) {
        return sendResponse(
          res,
          STATUS_CODES.FORBIDDEN,
          null,
          'You must be enrolled in this course to view progress.'
        );
      }

      // Get course with sections and lessons
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          sections: {
            include: {
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

      // Get user's lesson progress
      const allLessonIds = course.sections.flatMap((section) =>
        section.lessons.map((lesson) => lesson.id)
      );

      const lessonProgress = await prisma.userLessonProgress.findMany({
        where: {
          userId,
          lessonId: {
            in: allLessonIds,
          },
        },
      });

      // Get user's section progress
      const sectionIds = course.sections.map((section) => section.id);
      const sectionProgress = await prisma.userSectionProgress.findMany({
        where: {
          userId,
          sectionId: {
            in: sectionIds,
          },
        },
      });

      // Create progress maps for easy lookup
      const lessonProgressMap = new Map(
        lessonProgress.map((lp) => [lp.lessonId, lp])
      );
      const sectionProgressMap = new Map(
        sectionProgress.map((sp) => [sp.sectionId, sp])
      );

      // Build detailed progress response
      const detailedProgress = {
        course: {
          id: course.id,
          title: course.title,
          overallProgress: enrollment.progress,
          isCompleted: enrollment.completed,
          enrolledAt: enrollment.enrolledAt,
          completedAt: enrollment.completedAt,
        },
        sections: course.sections.map((section) => {
          const sectionProg = sectionProgressMap.get(section.id);
          const completedLessons = section.lessons.filter(
            (lesson) => lessonProgressMap.get(lesson.id)?.isCompleted
          ).length;

          return {
            id: section.id,
            title: section.title,
            order: section.order,
            isCompleted: sectionProg?.isCompleted || false,
            completedAt: sectionProg?.completedAt,
            lastAccessedAt: sectionProg?.lastAccessedAt,
            progress:
              section.lessons.length > 0
                ? (completedLessons / section.lessons.length) * 100
                : 0,
            totalLessons: section.lessons.length,
            completedLessons,
            lessons: section.lessons.map((lesson) => {
              const lessonProg = lessonProgressMap.get(lesson.id);
              return {
                id: lesson.id,
                title: lesson.title,
                order: lesson.order,
                isCompleted: lessonProg?.isCompleted || false,
                completedAt: lessonProg?.completedAt,
                lastAccessedAt: lessonProg?.lastAccessedAt,
                watchedDuration: lessonProg?.watchedDuration,
              };
            }),
          };
        }),
        statistics: {
          totalSections: course.sections.length,
          completedSections: course.sections.filter(
            (section) => sectionProgressMap.get(section.id)?.isCompleted
          ).length,
          totalLessons: allLessonIds.length,
          completedLessons: lessonProgress.filter((lp) => lp.isCompleted)
            .length,
          overallProgress: enrollment.progress,
          timeSpent: lessonProgress.reduce(
            (total, lp) => total + (lp.watchedDuration || 0),
            0
          ),
        },
      };

      return sendResponse(
        res,
        STATUS_CODES.OK,
        detailedProgress,
        'User progress retrieved successfully.'
      );
    } catch (error: any) {
      console.error('Get user progress error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while fetching progress. Please try again.'
      );
    }
  }
);

/**
 * @desc    Get user's overall progress across all enrolled courses
 * @route   GET /api/user/progress/overview
 * @access  Private (requires authentication)
 */
export const getUserProgressOverview = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?.id;

    try {
      if (!userId) {
        return sendResponse(
          res,
          STATUS_CODES.UNAUTHORIZED,
          null,
          'Authentication required to view progress overview.'
        );
      }

      // Get all enrolled courses with progress
      const enrolledCourses = await prisma.userCourse.findMany({
        where: { userId },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              sections: {
                include: {
                  lessons: {
                    select: { id: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { enrolledAt: 'desc' },
      });

      // Get recent lesson progress
      const recentLessonProgress = await prisma.userLessonProgress.findMany({
        where: { userId },
        include: {
          lesson: {
            include: {
              section: {
                include: {
                  course: {
                    select: {
                      id: true,
                      title: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { lastAccessedAt: 'desc' },
        take: 10,
      });

      // Calculate overall statistics
      const totalCourses = enrolledCourses.length;
      const completedCourses = enrolledCourses.filter(
        (ec) => ec.completed
      ).length;
      const totalLessons = enrolledCourses.reduce(
        (total, ec) =>
          total +
          ec.course.sections.reduce(
            (sectionTotal, section) => sectionTotal + section.lessons.length,
            0
          ),
        0
      );

      const completedLessons = await prisma.userLessonProgress.count({
        where: {
          userId,
          isCompleted: true,
        },
      });

      const totalTimeSpent = await prisma.userLessonProgress.aggregate({
        where: { userId },
        _sum: {
          watchedDuration: true,
        },
      });

      const averageProgress =
        totalCourses > 0
          ? enrolledCourses.reduce((sum, ec) => sum + ec.progress, 0) /
            totalCourses
          : 0;

      const progressOverview = {
        statistics: {
          totalCourses,
          completedCourses,
          inProgressCourses: totalCourses - completedCourses,
          totalLessons,
          completedLessons,
          averageProgress: Math.round(averageProgress * 100) / 100,
          totalTimeSpent: Math.round(
            (totalTimeSpent._sum.watchedDuration || 0) / 60
          ), // in minutes
        },
        courses: enrolledCourses.map((ec) => ({
          id: ec.course.id,
          title: ec.course.title,
          imageUrl: ec.course.imageUrl,
          progress: ec.progress,
          isCompleted: ec.completed,
          enrolledAt: ec.enrolledAt,
          completedAt: ec.completedAt,
          totalLessons: ec.course.sections.reduce(
            (total, section) => total + section.lessons.length,
            0
          ),
        })),
        recentActivity: recentLessonProgress.map((rlp) => ({
          id: rlp.id,
          lessonTitle: rlp.lesson.title,
          sectionTitle: rlp.lesson.section.title,
          courseTitle: rlp.lesson.section.course.title,
          courseId: rlp.lesson.section.course.id,
          isCompleted: rlp.isCompleted,
          lastAccessedAt: rlp.lastAccessedAt,
          completedAt: rlp.completedAt,
        })),
      };

      return sendResponse(
        res,
        STATUS_CODES.OK,
        progressOverview,
        'Progress overview retrieved successfully.'
      );
    } catch (error: any) {
      console.error('Get user progress overview error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while fetching progress overview. Please try again.'
      );
    }
  }
);
