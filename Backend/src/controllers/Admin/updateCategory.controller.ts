import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';

/**
 * @desc    Update category (Admin only)
 * @route   PUT /api/admin/categories/:id
 * @access  Private/Admin
 */
export const updateCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, slug, description } = req.body;

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
      const existingCategory = await prisma.category.findUnique({
        where: { id },
      });

      if (!existingCategory) {
        return sendResponse(
          res,
          STATUS_CODES.NOT_FOUND,
          null,
          'Category not found.'
        );
      }

      // Prepare update data
      const updateData: any = {};

      if (name && name !== existingCategory.name) {
        // Check if name is already taken
        const nameExists = await prisma.category.findFirst({
          where: {
            name,
            id: { not: id },
          },
        });

        if (nameExists) {
          return sendResponse(
            res,
            STATUS_CODES.CONFLICT,
            null,
            'Category name is already taken.'
          );
        }

        updateData.name = name.trim();
      }

      if (slug && slug !== existingCategory.slug) {
        // Check if slug is already taken
        const slugExists = await prisma.category.findFirst({
          where: {
            slug,
            id: { not: id },
          },
        });

        if (slugExists) {
          return sendResponse(
            res,
            STATUS_CODES.CONFLICT,
            null,
            'Category slug is already taken.'
          );
        }

        updateData.slug = slug.trim();
      }

      if (description !== undefined) {
        updateData.description = description?.trim() || null;
      }

      // If no updates, return early
      if (Object.keys(updateData).length === 0) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'No valid fields provided for update.'
        );
      }

      updateData.updatedAt = new Date();

      // Update category
      const updatedCategory = await prisma.category.update({
        where: { id },
        data: updateData,
      });

      // Get course count for the updated category
      const courseCount = await prisma.course.count({
        where: {
          categoryIds: {
            has: updatedCategory.id,
          },
        },
      });

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          ...updatedCategory,
          courseCount,
        },
        'Category updated successfully.'
      );
    } catch (error: any) {
      console.error('Update category error:', error);

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
        'An error occurred while updating the category. Please try again.'
      );
    }
  }
);
