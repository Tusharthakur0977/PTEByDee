import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { CustomRequest } from '../../types';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { SecureUrlService } from '../../services/secureUrlService';

/**
 * @desc    Get course details with signed URLs for payment success page
 * @route   GET /api/payment/course-details/:courseId
 * @access  Private (requires authentication)
 */
export const getCourseDetailsForPayment = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { courseId } = req.params;
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

      // Validate course ID format
      if (!courseId || courseId.length !== 24) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Invalid course ID format.'
        );
      }

      // Get course details
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          coursePreviewVideoUrl: true,
          price: true,
          currency: true,
          isFree: true,
          createdAt: true,
          updatedAt: true,
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

      // Check if user is enrolled (for access control)
      const enrollment = await prisma.userCourse.findUnique({
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

      const isEnrolled = !!enrollment;

      // Generate signed URLs for media content
      let imageUrl = null;
      let coursePreviewVideoUrl = null;

      // Generate signed URL for course image
      if (course.imageUrl && SecureUrlService.isConfigured()) {
        try {
          const signedUrlResponse =
            await SecureUrlService.generateSecureImageUrl(course.imageUrl, {
              expirationHours: 24,
            });
          imageUrl = signedUrlResponse.signedUrl;
        } catch (error) {
          console.warn(
            `Failed to generate signed URL for course ${course.id} image:`,
            error
          );
          imageUrl = course.imageUrl; // Fallback to original
        }
      } else {
        imageUrl = course.imageUrl;
      }

      // Generate signed URL for course preview video (only if enrolled or free)
      if (
        course.coursePreviewVideoUrl &&
        (isEnrolled || course.isFree) &&
        SecureUrlService.isConfigured()
      ) {
        try {
          const signedUrlResponse =
            await SecureUrlService.generateSecureVideoUrl(
              course.coursePreviewVideoUrl,
              { expirationHours: 24 }
            );
          coursePreviewVideoUrl = signedUrlResponse.signedUrl;
        } catch (error) {
          console.warn(
            `Failed to generate signed URL for course ${course.id} preview video:`,
            error
          );
          coursePreviewVideoUrl = course.coursePreviewVideoUrl; // Fallback
        }
      } else if (
        course.coursePreviewVideoUrl &&
        (isEnrolled || course.isFree)
      ) {
        coursePreviewVideoUrl = course.coursePreviewVideoUrl;
      }

      // Calculate course statistics
      const totalLessons = course.sections.reduce(
        (total, section) => total + section.lessons.length,
        0
      );

      const responseData = {
        id: course.id,
        title: course.title,
        description: course.description,
        imageUrl,
        coursePreviewVideoUrl,
        price: course.price,
        currency: course.currency,
        isFree: course.isFree,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        sectionCount: course.sections.length,
        totalLessons,
        sections: course.sections,
        enrollment: enrollment || null,
        isEnrolled,
      };

      return sendResponse(
        res,
        STATUS_CODES.OK,
        responseData,
        'Course details retrieved successfully.'
      );
    } catch (error: any) {
      console.error('Get course details for payment error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while retrieving course details. Please try again.'
      );
    }
  }
);
