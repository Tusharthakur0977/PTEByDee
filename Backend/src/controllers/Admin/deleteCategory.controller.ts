import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';

/**
 * @desc    Delete category (Admin only)
 * @route   DELETE /api/admin/categories/:id
 * @access  Private/Admin
 */
export const deleteCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      // Validate ObjectId format
      if (!id || id.length !== 24) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Invalid category ID format.'
        );
      }

      // Check if category exists
      const category = await prisma.category.findUnique({
        where: { id },
      });

      if (!category) {
        return sendResponse(
          res,
          STATUS_CODES.NOT_FOUND,
          null,
          'Category not found.'
        );
      }

      // Check if category is being used by any courses
      const coursesUsingCategory = await prisma.course.count({
        where: {
          categoryIds: {
            has: id,
          },
        },
      });

      if (coursesUsingCategory > 0) {
        return sendResponse(
          res,
          STATUS_CODES.CONFLICT,
          null,
          `Cannot delete category "${category.name}" as it is being used by ${coursesUsingCategory} course(s). Please remove the category from all courses first.`
        );
      }

      // Delete category
      await prisma.category.delete({
        where: { id },
      });

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          categoryId: id,
          categoryName: category.name,
        },
        `Category "${category.name}" deleted successfully.`
      );
    } catch (error: any) {
      console.error('Delete category error:', error);

      if (error.code === 'P2025') {
        return sendResponse(
          res,
          STATUS_CODES.NOT_FOUND,
          null,
          'Category not found.'
        );
      }

      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while deleting the category. Please try again.'
      );
    }
  }
);
