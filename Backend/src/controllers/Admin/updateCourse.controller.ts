import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { CustomRequest } from '../../types';

/**
 * @desc    Update a course with sections and lessons (Admin only)
 * @route   PUT /api/admin/courses/:id
 * @access  Private/Admin
 */
export const updateCourse = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { id } = req.params;
    const {
      title,
      description,
      coursePreviewVideoUrl,
      isFree,
      imageUrl,
      price,
      currency,
      categoryIds,
      sections,
    } = req.body;

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

      // Check if course exists
      const existingCourse = await prisma.course.findUnique({
        where: { id },
        include: {
          sections: {
            include: {
              lessons: true,
            },
          },
        },
      });

      if (!existingCourse) {
        return sendResponse(
          res,
          STATUS_CODES.NOT_FOUND,
          null,
          'Course not found.'
        );
      }

      // Input validation
      if (!title || !description) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Title and description are required.'
        );
      }

      // Validate price for paid courses
      if (!isFree && (!price || price <= 0)) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Price is required for paid courses and must be greater than 0.'
        );
      }

      // Validate categoryIds if provided
      if (categoryIds && categoryIds.length > 0) {
        const existingCategories = await prisma.category.findMany({
          where: {
            id: {
              in: categoryIds,
            },
          },
        });

        if (existingCategories.length !== categoryIds.length) {
          return sendResponse(
            res,
            STATUS_CODES.BAD_REQUEST,
            null,
            'One or more category IDs are invalid.'
          );
        }
      }

      // Update course with sections and lessons in a transaction
      const updatedCourse = await prisma.$transaction(async (tx) => {
        // Update the main course
        const course = await tx.course.update({
          where: { id },
          data: {
            title,
            description,
            coursePreviewVideoUrl: coursePreviewVideoUrl || null,
            isFree: isFree || false,
            imageUrl: imageUrl || null,
            price: isFree ? null : price,
            currency: isFree ? null : (currency || 'USD'),
            categoryIds: categoryIds || [],
            updatedAt: new Date(),
          },
        });

        // Handle sections update
        if (sections && sections.length > 0) {
          // Get existing section IDs
          const existingSectionIds = existingCourse.sections.map(s => s.id);
          const newSectionIds = sections
            .filter((s: any) => s.id && !s.id.startsWith('section_'))
            .map((s: any) => s.id);

          // Delete sections that are no longer present
          const sectionsToDelete = existingSectionIds.filter(
            id => !newSectionIds.includes(id)
          );

          if (sectionsToDelete.length > 0) {
            // Delete lessons first (cascade should handle this, but being explicit)
            await tx.lesson.deleteMany({
              where: {
                sectionId: {
                  in: sectionsToDelete,
                },
              },
            });

            // Delete sections
            await tx.courseSection.deleteMany({
              where: {
                id: {
                  in: sectionsToDelete,
                },
              },
            });
          }

          // Process each section
          for (const [sectionIndex, section] of sections.entries()) {
            if (!section.title) {
              throw new Error(`Section ${sectionIndex + 1} title is required.`);
            }

            let sectionRecord;

            if (section.id && !section.id.startsWith('section_')) {
              // Update existing section
              sectionRecord = await tx.courseSection.update({
                where: { id: section.id },
                data: {
                  title: section.title,
                  description: section.description || '',
                  videoUrl: section.videoUrl || null,
                  order: section.order || sectionIndex + 1,
                  updatedAt: new Date(),
                },
              });
            } else {
              // Create new section
              sectionRecord = await tx.courseSection.create({
                data: {
                  title: section.title,
                  description: section.description || '',
                  videoUrl: section.videoUrl || null,
                  courseId: course.id,
                  order: section.order || sectionIndex + 1,
                },
              });
            }

            // Handle lessons for this section
            if (section.lessons && section.lessons.length > 0) {
              // Get existing lesson IDs for this section
              const existingLessons = existingCourse.sections
                .find(s => s.id === section.id)?.lessons || [];
              const existingLessonIds = existingLessons.map(l => l.id);
              const newLessonIds = section.lessons
                .filter((l: any) => l.id && !l.id.startsWith('lesson_'))
                .map((l: any) => l.id);

              // Delete lessons that are no longer present
              const lessonsToDelete = existingLessonIds.filter(
                id => !newLessonIds.includes(id)
              );

              if (lessonsToDelete.length > 0) {
                await tx.lesson.deleteMany({
                  where: {
                    id: {
                      in: lessonsToDelete,
                    },
                  },
                });
              }

              // Process each lesson
              for (const [lessonIndex, lesson] of section.lessons.entries()) {
                if (!lesson.title) {
                  throw new Error(
                    `Lesson ${lessonIndex + 1} in section "${section.title}" title is required.`
                  );
                }

                if (lesson.id && !lesson.id.startsWith('lesson_')) {
                  // Update existing lesson
                  await tx.lesson.update({
                    where: { id: lesson.id },
                    data: {
                      title: lesson.title,
                      description: lesson.description || '',
                      videoUrl: lesson.videoUrl || null,
                      textContent: lesson.textContent || null,
                      audioUrl: lesson.audioUrl || null,
                      order: lesson.order || lessonIndex + 1,
                      updatedAt: new Date(),
                    },
                  });
                } else {
                  // Create new lesson
                  await tx.lesson.create({
                    data: {
                      title: lesson.title,
                      description: lesson.description || '',
                      videoUrl: lesson.videoUrl || null,
                      textContent: lesson.textContent || null,
                      audioUrl: lesson.audioUrl || null,
                      sectionId: sectionRecord.id,
                      order: lesson.order || lessonIndex + 1,
                    },
                  });
                }
              }
            } else {
              // If no lessons provided, delete all existing lessons for this section
              await tx.lesson.deleteMany({
                where: {
                  sectionId: sectionRecord.id,
                },
              });
            }
          }
        } else {
          // If no sections provided, delete all existing sections and lessons
          const existingSectionIds = existingCourse.sections.map((s) => s.id);

          if (existingSectionIds.length > 0) {
            await tx.lesson.deleteMany({
              where: {
                sectionId: {
                  in: existingSectionIds,
                },
              },
            });
          }

          await tx.courseSection.deleteMany({
            where: {
              courseId: course.id,
            },
          });
        }

        // Return the complete updated course
        return await tx.course.findUnique({
          where: { id: course.id },
          include: {
            sections: {
              include: {
                lessons: {
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
                    profilePictureUrl: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
            userCourses: {
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
          },
        });
      });

      return sendResponse(
        res,
        STATUS_CODES.OK,
        updatedCourse,
        'Course updated successfully.'
      );
    } catch (error: any) {
      console.error('Update course error:', error);
      
      // Handle specific validation errors
      if (error.message.includes('title is required') || 
          error.message.includes('Lesson') || 
          error.message.includes('Section')) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          error.message
        );
      }

      // Handle Prisma specific errors
      if (error.code === 'P2025') {
        return sendResponse(
          res,
          STATUS_CODES.NOT_FOUND,
          null,
          'Course or related resource not found.'
        );
      }

      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while updating the course. Please try again.'
      );
    }
  }
);