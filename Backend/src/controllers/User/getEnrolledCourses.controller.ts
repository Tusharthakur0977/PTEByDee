import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { CustomRequest } from '../../types';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { SecureUrlService } from '../../services/secureUrlService';

/**
 * @desc    Get user's enrolled courses
 * @route   GET /api/user/enrolled-courses
 * @access  Private (requires authentication)
 */
export const getEnrolledCourses = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?.id;

    try {
      if (!userId) {
        return sendResponse(
          res,
          STATUS_CODES.UNAUTHORIZED,
          null,
          'Authentication required to view enrolled courses.'
        );
      }

      // Get user's enrolled courses with full course details
      const enrolledCourses = await prisma.userCourse.findMany({
        where: {
          userId: userId,
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              imageUrl: true,
              coursePreviewVideoUrl: true,
              isFree: true,
              price: true,
              currency: true,
              averageRating: true,
              reviewCount: true,
              createdAt: true,
              updatedAt: true,
              _count: {
                select: {
                  userCourses: true,
                  sections: true,
                },
              },
              sections: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  videoUrl: true,
                  videoKey: true,
                  order: true,
                  lessons: {
                    select: {
                      id: true,
                      title: true,
                      description: true,
                      videoUrl: true,
                      videoKey: true,
                      textContent: true,
                      audioUrl: true,
                      order: true,
                    },
                    orderBy: { order: 'asc' },
                  },
                },
                orderBy: { order: 'asc' },
              },
              reviews: {
                select: {
                  id: true,
                  rating: true,
                  comment: true,
                  createdAt: true,
                  user: {
                    select: {
                      id: true,
                      name: true,
                      profilePictureUrl: true,
                    },
                  },
                },
                orderBy: { createdAt: 'desc' },
                take: 3,
              },
            },
          },
        },
        orderBy: { enrolledAt: 'desc' },
      });

      // Transform the data to match the frontend Course interface with signed URLs
      const transformedCourses = await Promise.all(
        enrolledCourses.map(async (enrollment) => {
          // Generate signed URL for course image
          let imageUrl = null;
          if (enrollment.course.imageUrl && SecureUrlService.isConfigured()) {
            try {
              const signedUrlResponse =
                await SecureUrlService.generateSecureImageUrl(
                  enrollment.course.imageUrl,
                  {
                    expirationHours: 24,
                  }
                );
              imageUrl = signedUrlResponse.signedUrl;
            } catch (error) {
              console.warn(
                `Failed to generate signed URL for course ${enrollment.course.id} image:`,
                error
              );
              imageUrl = enrollment.course.imageUrl; // Fallback to original
            }
          } else {
            imageUrl = enrollment.course.imageUrl;
          }

          // Generate signed URL for course preview video (enrolled users can access)
          let coursePreviewVideoUrl = null;
          if (
            enrollment.course.coursePreviewVideoUrl &&
            SecureUrlService.isConfigured()
          ) {
            try {
              const signedUrlResponse =
                await SecureUrlService.generateSecureVideoUrl(
                  enrollment.course.coursePreviewVideoUrl,
                  { expirationHours: 24 }
                );
              coursePreviewVideoUrl = signedUrlResponse.signedUrl;
            } catch (error) {
              console.warn(
                `Failed to generate signed URL for course ${enrollment.course.id} preview video:`,
                error
              );
              coursePreviewVideoUrl = enrollment.course.coursePreviewVideoUrl; // Fallback
            }
          } else {
            coursePreviewVideoUrl = enrollment.course.coursePreviewVideoUrl;
          }

          return {
            id: enrollment.course.id,
            title: enrollment.course.title,
            description: enrollment.course.description,
            imageUrl,
            coursePreviewVideoUrl,
            isFree: enrollment.course.isFree,
            price: enrollment.course.price || 0,
            currency: enrollment.course.currency,
            averageRating: enrollment.course.averageRating || 0,
            reviewCount: enrollment.course.reviewCount || 0,
            enrollmentCount: enrollment.course._count.userCourses,
            sectionCount: enrollment.course._count.sections,
            createdAt: enrollment.course.createdAt,
            updatedAt: enrollment.course.updatedAt,
            reviews: enrollment.course.reviews,
            sections: enrollment.course.sections,

            // Frontend compatibility fields
            students: enrollment.course._count.userCourses,
            rating: enrollment.course.averageRating || 0,
            level: 'All Levels',
            duration: `${enrollment.course._count.sections} sections`,

            // User enrollment data
            isEnrolled: true,
            userEnrollment: {
              id: enrollment.id,
              progress: enrollment.progress,
              completed: enrollment.completed,
              enrolledAt: enrollment.enrolledAt.toISOString(),
              completedAt: enrollment.completedAt?.toISOString() || null,
            },

            // Mock curriculum structure for frontend compatibility
            curriculum: enrollment.course.sections.map((section) => ({
              title: section.title,
              lessons: section.lessons.map((lesson) => ({
                title: lesson.title,
                duration: '15 min',
                videoUrl: lesson.videoUrl,
                audioUrl: lesson.audioUrl,
                type: lesson.videoUrl
                  ? 'video'
                  : lesson.audioUrl
                  ? 'audio'
                  : 'text',
                isPreview: false, // All lessons are accessible for enrolled users
              })),
            })),
          };
        })
      );

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          courses: transformedCourses,
          totalEnrolled: transformedCourses.length,
        },
        'Enrolled courses retrieved successfully.'
      );
    } catch (error: any) {
      console.error('Get enrolled courses error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while fetching enrolled courses. Please try again.'
      );
    }
  }
);
