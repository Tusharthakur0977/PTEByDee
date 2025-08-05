import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { sendResponse } from '../../utils/helpers';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/admin/users
 * @access  Private/Admin (requires 'protect' and 'isAdmin' middlewares)
 */

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      role,
      provider,
      isVerified,
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
          name: {
            contains: search as string,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search as string,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Filter by role
    if (role) {
      whereClause.role = role;
    }

    // Filter by provider
    if (provider) {
      whereClause.provider = provider;
    }

    // Filter by verification status
    if (isVerified !== undefined) {
      whereClause.isVerified = isVerified === 'true';
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder as 'asc' | 'desc';

    // Get total count for pagination
    const totalUsers = await prisma.user.count({
      where: whereClause,
    });

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        provider: true,
        isVerified: true,
        profilePictureUrl: true,
        googleId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            courses: true,
            testAttempts: true,
          },
        },
      },
      orderBy,
      skip,
      take: limitNumber,
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalUsers / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    // Prepare response data
    const responseData = {
      users,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalUsers,
        hasNextPage,
        hasPrevPage,
        limit: limitNumber,
      },
      filters: {
        search: search as string,
        role: role as string,
        provider: provider as string,
        isVerified: isVerified as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as string,
      },
    };

    return sendResponse(
      res,
      STATUS_CODES.OK,
      responseData,
      `Retrieved ${users.length} users successfully.`
    );
  } catch (error: any) {
    console.error('Get all users error:', error);
    return sendResponse(
      res,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      null,
      'An error occurred while fetching users. Please try again.'
    );
  }
});
