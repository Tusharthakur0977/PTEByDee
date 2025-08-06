import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';

/**
 * @desc    Get a single course by ID for public viewing (no authentication required)
 * @route   GET /api/user/courses/:id/public
 * @access  Public
 */
export const getPublicCourseById = asyncHandler(
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
          // Get sections with lessons (limited info for public view)
          sections: {
            select: {
              id: true,
              title: true,
              description: true,
              order: true,
              lessons: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  order: true,
                  // Only show first lesson content as preview
                },
                orderBy: { order: 'asc' },
                take: 1, // Only first lesson for preview
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

      // Transform course data for frontend compatibility (public view)
      const transformedCourse = {
        id: course.id,
        title: course.title,
        description: course.description,
        detailedDescription: course.description,
        imageUrl: course.imageUrl,
        coursePreviewVideoUrl: course.coursePreviewVideoUrl,
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
        level: 'All Levels',
        duration: `${course._count.sections} sections`,

        // User-specific data (public view)
        isEnrolled: false,
        userEnrollment: null,

        // Course content (limited for public view)
        sections: course.sections.map((section) => ({
          id: section.id,
          title: section.title,
          description: section.description,
          videoUrl: null, // No video access for public view
          videoKey: null,
          order: section.order,
          lessons: section.lessons.map((lesson, index) => ({
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            order: lesson.order,
            // No content access for public view
            videoUrl: null,
            videoKey: null,
            textContent: null,
            audioUrl: null,
            type: 'video', // Default type
            isPreview: index === 0,
            duration: '15 min',
          })),
        })),

        // Reviews
        reviews: course.reviews,

        // Mock instructor data
        instructor: {
          name: 'Expert Instructor',
          bio: 'Experienced PTE trainer with proven track record',
          experience: '5+ years',
        },

        // Mock features
        features: [
          'Comprehensive course content',
          'Expert instruction',
          'Practice materials',
          'Progress tracking',
          'Certificate of completion',
          'Lifetime access',
        ],

        // Mock curriculum structure for frontend compatibility (public view)
        curriculum: course.sections.map((section) => ({
          title: section.title,
          lessons: section.lessons.map((lesson) => ({
            title: lesson.title,
            duration: '15 min',
            videoUrl: null, // No access for public view
            type: 'video',
            isPreview: false, // No previews in public view
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
      console.error('Get public course by ID error:', error);

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
