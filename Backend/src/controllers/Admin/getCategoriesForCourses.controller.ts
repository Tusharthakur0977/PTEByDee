import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';

/**
 * @desc    Get all categories for course creation/editing (Admin only)
 * @route   GET /api/admin/categories
 * @access  Private/Admin
 */
export const getCategoriesForCourses = asyncHandler(
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
            ...category,
            courseCount,
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

/**
 * @desc    Create a new category (Admin only)
 * @route   POST /api/admin/categories
 * @access  Private/Admin
 */
export const createCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, slug, description } = req.body;

    try {
      // Input validation
      if (!name || !slug) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Name and slug are required.'
        );
      }

      // Check if category with same name or slug exists
      const existingCategory = await prisma.category.findFirst({
        where: {
          OR: [
            { name: name },
            { slug: slug },
          ],
        },
      });

      if (existingCategory) {
        return sendResponse(
          res,
          STATUS_CODES.CONFLICT,
          null,
          'Category with this name or slug already exists.'
        );
      }

      const category = await prisma.category.create({
        data: {
          name,
          slug,
          description: description || null,
        },
      });

      return sendResponse(
        res,
        STATUS_CODES.CREATED,
        category,
        'Category created successfully.'
      );
    } catch (error: any) {
      console.error('Create category error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while creating the category. Please try again.'
      );
    }
  }
);