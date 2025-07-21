import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';

/**
 * @desc    Get all courses with pagination, search, and filtering (Admin only)
 * @route   GET /api/admin/courses
 * @access  Private/Admin
 */
export const getAllCourses = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const {
        page = '1',
        limit = '10',
        search = '',
        isFree,
        categoryId,
        sortBy = 'createdAt',
        sortOrder = 'desc',
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

      // Get courses with all related data
      const courses = await prisma.course.findMany({
        where: whereClause,
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
            take: 3, // Latest 3 reviews for listing
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
        orderBy,
        skip,
        take: limitNumber,
      });

      // Calculate pagination info
      const totalPages = Math.ceil(totalCourses / limitNumber);
      const hasNextPage = pageNumber < totalPages;
      const hasPrevPage = pageNumber > 1;

      // Prepare response data
      const responseData = {
        courses,
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
        `Retrieved ${courses.length} courses successfully.`
      );
    } catch (error: any) {
      console.error('Get all courses error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while fetching courses. Please try again.'
      );
    }
  }
);