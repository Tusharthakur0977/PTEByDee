import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { CustomRequest } from '../../types';

import jwt from 'jsonwebtoken';

/**
 * @desc    Get all courses for users (public access)
 * @route   GET /api/user/courses
 * @access  Public (but shows different data if user is authenticated)
 */
export const getCourses = asyncHandler(async (req: Request, res: Response) => {
  try {
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

    const {
      page = '1',
      limit = '12',
      search = '',
      isFree,
      categoryId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      level,
    } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build where clause for filtering
    const whereClause: any = {};

    // Search functionality
    if (search) {
      whereClause.OR = [
        {
          title: {
            contains: search as string,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search as string,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Filter by free/paid
    if (isFree !== undefined) {
      whereClause.isFree = isFree === 'true';
    }

    // Filter by category
    if (categoryId) {
      whereClause.categoryIds = {
        has: categoryId as string,
      };
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder as 'asc' | 'desc';

    // Get total count for pagination
    const totalCourses = await prisma.course.count({
      where: whereClause,
    });

    // Get courses with basic information (no sensitive admin data)
    const courses = await prisma.course.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        isFree: true,
        price: true,
        currency: true,
        averageRating: true,
        reviewCount: true,
        createdAt: true,
        updatedAt: true,
        // Get basic stats
        _count: {
          select: {
            userCourses: true,
            sections: true,
          },
        },
        // Get sample reviews
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
        // Get user enrollment if authenticated
        userCourses: userId
          ? {
              where: {
                userId: userId,
              },
              select: {
                id: true,
                progress: true,
                completed: true,
                enrolledAt: true,
                completedAt: true,
              },
            }
          : false,
      },
      orderBy,
      skip,
      take: limitNumber,
    });

    // Transform courses to include computed fields
    const transformedCourses = courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      imageUrl: course.imageUrl,
      isFree: course.isFree,
      price: course.price,
      currency: course.currency,
      averageRating: course.averageRating || 0,
      reviewCount: course.reviewCount || 0,
      enrollmentCount: course._count.userCourses,
      sectionCount: course._count.sections,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      reviews: course.reviews,
      // Computed fields for frontend compatibility
      students: course._count.userCourses,
      rating: course.averageRating || 0,
      level: 'All Levels', // Default level, can be enhanced later
      duration: `${course._count.sections} sections`, // Basic duration info
      // User enrollment status
      isEnrolled: userId
        ? course.userCourses && course.userCourses.length > 0
        : false,
      userEnrollment:
        userId && course.userCourses && course.userCourses.length > 0
          ? course.userCourses[0]
          : null,
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCourses / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    // Prepare response data
    const responseData = {
      courses: transformedCourses,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalCourses,
        hasNextPage,
        hasPrevPage,
        limit: limitNumber,
      },
      filters: {
        search: search as string,
        isFree: isFree as string,
        categoryId: categoryId as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as string,
      },
    };

    return sendResponse(
      res,
      STATUS_CODES.OK,
      responseData,
      `Retrieved ${transformedCourses.length} courses successfully.`
    );
  } catch (error: any) {
    console.error('Get courses error:', error);
    return sendResponse(
      res,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      null,
      'An error occurred while fetching courses. Please try again.'
    );
  }
});
