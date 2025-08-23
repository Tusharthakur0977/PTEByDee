import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { CustomRequest } from '../../types';
import { SecureUrlService } from '../../services/secureUrlService';

import jwt from 'jsonwebtoken';

/**
 * @desc    Get a single course by ID for users
 * @route   GET /api/user/courses/:id
 * @access  Public (but shows different data if user is authenticated)
 */
export const getCourseById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    // Try to get user ID from token if provided (optional authentication)
    let userId: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        // Verify user exists
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true },
        });

        if (user) {
          userId = user.id;
        }
      } catch (error) {
        // Invalid token, continue as unauthenticated user
        console.log('Invalid or expired token, continuing as public user');
      }
    }

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

      const course = await prisma.course.findUnique({
        where: { id },
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
          // Get sections with lessons (limited info for non-enrolled users)
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
          // Get reviews with user info
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
            take: 10,
          },
          // Get enrollment count
          _count: {
            select: {
              userCourses: true,
              sections: true,
            },
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

      // Check if user is enrolled (if authenticated)
      let userEnrollment = null;
      let isEnrolled = false;

      if (userId) {
        userEnrollment = await prisma.userCourse.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId: id,
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

        isEnrolled = !!userEnrollment;
      }

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
          imageUrl = course.imageUrl;
        }
      } else {
        imageUrl = course.imageUrl;
      }

      // Generate signed URL for course preview video (only if user is enrolled or it's free)
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
          coursePreviewVideoUrl = course.coursePreviewVideoUrl;
        }
      } else if (
        course.coursePreviewVideoUrl &&
        (isEnrolled || course.isFree)
      ) {
        coursePreviewVideoUrl = course.coursePreviewVideoUrl;
      }

      // Transform course data for frontend compatibility
      const transformedCourse = {
        id: course.id,
        title: course.title,
        description: course.description,
        detailedDescription: course.description, // Use same description for detailed view
        imageUrl,
        coursePreviewVideoUrl,
        isFree: course.isFree,
        price: course.price || 0,
        currency: course.currency || 'USD',
        averageRating: course.averageRating || 0,
        reviewCount: course.reviewCount || 0,
        enrollmentCount: course._count.userCourses,
        sectionCount: course._count.sections,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,

        // Frontend compatibility fields
        rating: course.averageRating || 0,
        students: course._count.userCourses,
        level: 'All Levels', // Default level
        duration: `${course._count.sections} sections`,

        // User-specific data
        isEnrolled,
        userEnrollment,

        // Course content
        sections: course.sections.map((section) => ({
          id: section.id,
          title: section.title,
          description: section.description,
          videoUrl: isEnrolled ? section.videoUrl : null,
          videoKey: isEnrolled ? section.videoKey : null,
          order: section.order,
          lessons: section.lessons.map((lesson, index) => ({
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            order: lesson.order,
            // Show content based on enrollment status and preview availability
            videoUrl: isEnrolled || index === 0 ? lesson.videoUrl : null,
            videoKey: isEnrolled || index === 0 ? lesson.videoKey : null,
            textContent: isEnrolled || index === 0 ? lesson.textContent : null,
            audioUrl: isEnrolled || index === 0 ? lesson.audioUrl : null,
            type: lesson.videoUrl
              ? 'video'
              : lesson.audioUrl
              ? 'audio'
              : 'text',
            isPreview: index === 0, // First lesson is always preview
            duration: '15 min', // Default duration, can be enhanced
          })),
        })),

        // Reviews
        reviews: course.reviews,

        // Mock instructor data (can be enhanced later)
        instructor: {
          name: 'Expert Instructor',
          bio: 'Experienced PTE trainer with proven track record',
          experience: '5+ years',
        },

        // Mock features (can be enhanced later)
        features: [
          'Comprehensive course content',
          'Expert instruction',
          'Practice materials',
          'Progress tracking',
          'Certificate of completion',
          'Lifetime access',
        ],

        // Mock curriculum structure for frontend compatibility
        curriculum: course.sections.map((section, sectionIndex) => ({
          title: section.title,
          lessons: section.lessons.map((lesson, lessonIndex) => ({
            title: lesson.title,
            duration: '15 min',
            videoUrl: isEnrolled || lessonIndex === 0 ? lesson.videoUrl : null,
            type: lesson.videoUrl
              ? 'video'
              : lesson.audioUrl
              ? 'audio'
              : 'text',
            isPreview: lessonIndex === 0,
          })),
        })),
      };

      return sendResponse(
        res,
        STATUS_CODES.OK,
        transformedCourse,
        'Course retrieved successfully.'
      );
    } catch (error: any) {
      console.error('Get course by ID error:', error);

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
