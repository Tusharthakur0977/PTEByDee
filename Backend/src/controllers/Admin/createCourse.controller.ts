import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { CustomRequest } from '../../types';
import { StripeProductService } from '../../services/stripeProductService';

/**
 * @desc    Create a new course with sections and lessons
 * @route   POST /api/admin/courses
 * @access  Private/Admin
 */
export const createCourse = asyncHandler(
  async (req: CustomRequest, res: Response) => {
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

      // Create course with sections and lessons in a transaction
      const course = await prisma.$transaction(async (tx) => {
        let stripeProductId = null;
        let stripePriceId = null;

        // Create Stripe product and price for paid courses
        if (!isFree && price > 0) {
          try {
            const stripeData = await StripeProductService.createProductAndPrice(
              {
                courseId: 'temp', // Will be updated after course creation
                name: title,
                description,
                // imageUrl,
                price,
                currency: currency || 'USD',
              }
            );
            stripeProductId = stripeData.productId;
            stripePriceId = stripeData.priceId;
          } catch (error) {
            console.error('Failed to create Stripe product:', error);
            throw new Error(
              'Failed to set up payment processing for this course'
            );
          }
        }

        // Create the main course
        const newCourse = await tx.course.create({
          data: {
            title,
            description,
            coursePreviewVideoUrl:
              typeof coursePreviewVideoUrl === 'string'
                ? coursePreviewVideoUrl
                : null,
            isFree: isFree || false,
            imageUrl: typeof imageUrl === 'string' ? imageUrl : null,
            price: isFree ? null : price,
            currency: isFree ? null : currency || 'USD',
            categoryIds: categoryIds || [],
            averageRating: 0.0,
            reviewCount: 0,
            stripeProductId,
            stripePriceId,
          },
        });

        // Update Stripe product metadata with actual course ID
        if (stripeProductId && !isFree) {
          try {
            await StripeProductService.updateProduct(stripeProductId, {
              courseId: newCourse.id,
              name: title,
              description,
              // imageUrl,
              price,
              currency: currency || 'USD',
            });
          } catch (error) {
            console.warn('Failed to update Stripe product metadata:', error);
            // Don't fail the course creation for this
          }
        }

        // Create sections if provided
        if (sections && sections.length > 0) {
          for (const [sectionIndex, section] of sections.entries()) {
            if (!section.title) {
              throw new Error(`Section ${sectionIndex + 1} title is required.`);
            }

            const newSection = await tx.courseSection.create({
              data: {
                title: section.title,
                description: section.description || '',
                videoUrl: section.videoUrl || null,
                courseId: newCourse.id,
                order: section.order || sectionIndex + 1,
              },
            });

            // Create lessons for this section if provided
            if (section.lessons && section.lessons.length > 0) {
              for (const [lessonIndex, lesson] of section.lessons.entries()) {
                if (!lesson.title) {
                  throw new Error(
                    `Lesson ${lessonIndex + 1} in section "${
                      section.title
                    }" title is required.`
                  );
                }

                await tx.lesson.create({
                  data: {
                    title: lesson.title,
                    description: lesson.description || '',
                    videoUrl: lesson.videoUrl || null,
                    textContent: lesson.textContent || null,
                    audioUrl: lesson.audioUrl || null,
                    sectionId: newSection.id,
                    order: lesson.order || lessonIndex + 1,
                  },
                });
              }
            }
          }
        }

        // Return the complete course with sections and lessons
        return await tx.course.findUnique({
          where: { id: newCourse.id },
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
              take: 5, // Latest 5 reviews
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
        STATUS_CODES.CREATED,
        course,
        'Course created successfully.'
      );
    } catch (error: any) {
      console.error('Create course error:', error);

      // Handle specific validation errors
      if (
        error.message.includes('title is required') ||
        error.message.includes('Lesson') ||
        error.message.includes('Section')
      ) {
        return sendResponse(res, STATUS_CODES.BAD_REQUEST, null, error.message);
      }

      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while creating the course. Please try again.'
      );
    }
  }
);
