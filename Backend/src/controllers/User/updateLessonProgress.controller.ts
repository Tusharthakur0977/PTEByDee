import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { CustomRequest } from '../../types';

/**
 * @desc    Update user's lesson progress
 * @route   POST /api/user/lessons/:lessonId/progress
 * @access  Private (requires authentication)
 */
export const updateLessonProgress = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { lessonId } = req.params;
    const userId = req.user?.id;
    const { isCompleted, watchedDuration } = req.body;

    try {
      if (!userId) {
        return sendResponse(
          res,
          STATUS_CODES.UNAUTHORIZED,
          null,
          'Authentication required to update lesson progress.'
        );
      }

      // Validate ObjectId format
      if (!lessonId || lessonId.length !== 24) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Invalid lesson ID format.'
        );
      }

      // Check if lesson exists and get course info
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
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
      });

      if (!lesson) {
        return sendResponse(
          res,
          STATUS_CODES.NOT_FOUND,
          null,
          'Lesson not found.'
        );
      }

      // Check if user is enrolled in the course
      const enrollment = await prisma.userCourse.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: lesson.section.course.id,
          },
        },
      });

      if (!enrollment) {
        return sendResponse(
          res,
          STATUS_CODES.FORBIDDEN,
          null,
          'You must be enrolled in this course to track lesson progress.'
        );
      }

      // Update or create lesson progress
      const progressData: any = {
        lastAccessedAt: new Date(),
      };

      if (typeof isCompleted === 'boolean') {
        progressData.isCompleted = isCompleted;
        if (isCompleted) {
          progressData.completedAt = new Date();
        } else {
          progressData.completedAt = null;
        }
      }

      if (typeof watchedDuration === 'number' && watchedDuration >= 0) {
        progressData.watchedDuration = watchedDuration;
      }

      const lessonProgress = await prisma.userLessonProgress.upsert({
        where: {
          userId_lessonId: {
            userId,
            lessonId,
          },
        },
        update: progressData,
        create: {
          userId,
          lessonId,
          ...progressData,
        },
      });

      // Update section progress if lesson is completed
      if (isCompleted) {
        await updateSectionProgress(userId, lesson.section.id);
      }

      // Update course progress
      await updateCourseProgress(userId, lesson.section.course.id);

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          lessonProgress,
          lessonId,
          sectionId: lesson.section.id,
          courseId: lesson.section.course.id,
        },
        'Lesson progress updated successfully.'
      );
    } catch (error: any) {
      console.error('Update lesson progress error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while updating lesson progress. Please try again.'
      );
    }
  }
);

/**
 * Helper function to update section progress
 */
async function updateSectionProgress(userId: string, sectionId: string) {
  try {
    // Get all lessons in the section
    const section = await prisma.courseSection.findUnique({
      where: { id: sectionId },
      include: {
        lessons: {
          select: { id: true },
        },
      },
    });

    if (!section || section.lessons.length === 0) {
      return;
    }

    // Get completed lessons count
    const completedLessons = await prisma.userLessonProgress.count({
      where: {
        userId,
        lessonId: {
          in: section.lessons.map((l) => l.id),
        },
        isCompleted: true,
      },
    });

    const isCompleted = completedLessons === section.lessons.length;

    // Update section progress
    await prisma.userSectionProgress.upsert({
      where: {
        userId_sectionId: {
          userId,
          sectionId,
        },
      },
      update: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        lastAccessedAt: new Date(),
      },
      create: {
        userId,
        sectionId,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        lastAccessedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error updating section progress:', error);
  }
}

/**
 * Helper function to update course progress
 */
async function updateCourseProgress(userId: string, courseId: string) {
  try {
    // Get all lessons in the course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        sections: {
          include: {
            lessons: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!course) {
      return;
    }

    const allLessonIds = course.sections.flatMap((section) =>
      section.lessons.map((lesson) => lesson.id)
    );

    if (allLessonIds.length === 0) {
      return;
    }

    // Get completed lessons count
    const completedLessons = await prisma.userLessonProgress.count({
      where: {
        userId,
        lessonId: {
          in: allLessonIds,
        },
        isCompleted: true,
      },
    });

    const progress = (completedLessons / allLessonIds.length) * 100;
    const isCompleted = progress === 100;

    // Update course enrollment progress
    await prisma.userCourse.update({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      data: {
        progress,
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });
  } catch (error) {
    console.error('Error updating course progress:', error);
  }
}
