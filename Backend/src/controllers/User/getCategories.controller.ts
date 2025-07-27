import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';

/**
 * @desc    Get all categories for users
 * @route   GET /api/user/categories
 * @access  Public
 */
export const getCategories = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
      });

      // Get course count for each category
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
          const courseCount = await prisma.course.count({
            where: {
              categoryIds: {
                has: category.id,
              },
            },
          });

          return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            courseCount,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
          };
        })
      );

      return sendResponse(
        res,
        STATUS_CODES.OK,
        categoriesWithCounts,
        'Categories retrieved successfully.'
      );
    } catch (error: any) {
      console.error('Get categories error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while fetching categories. Please try again.'
      );
    }
  }
);
