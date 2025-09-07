import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { CustomRequest } from '../../types';

/**
 * @desc    Get user's question responses with pagination and filtering
 * @route   GET /api/user/responses
 * @access  Private (requires authentication)
 */
export const getUserResponses = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?.id;
    const {
      page = 1,
      limit = 10,
      questionType,
      isCorrect,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    try {
      if (!userId) {
        return sendResponse(
          res,
          STATUS_CODES.UNAUTHORIZED,
          null,
          'Authentication required.'
        );
      }

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);
      const skip = (pageNumber - 1) * limitNumber;

      // Build where clause
      const whereClause: any = {
        userId,
      };

      if (questionType) {
        whereClause.question = {
          questionType: {
            name: questionType,
          },
        };
      }

      if (isCorrect !== undefined) {
        whereClause.isCorrect = isCorrect === 'true';
      }

      // Get total count
      const totalResponses = await prisma.userResponse.count({
        where: whereClause,
      });

      // Get responses with pagination
      const responses = await prisma.userResponse.findMany({
        where: whereClause,
        include: {
          question: {
            include: {
              questionType: {
                include: {
                  pteSection: true,
                },
              },
            },
          },
        },
        orderBy: {
          [sortBy as string]: sortOrder,
        },
        skip,
        take: limitNumber,
      });

      // Calculate pagination info
      const totalPages = Math.ceil(totalResponses / limitNumber);
      const hasNextPage = pageNumber < totalPages;
      const hasPrevPage = pageNumber > 1;

      // Format response data
      const formattedResponses = responses.map((response) => ({
        id: response.id,
        questionId: response.questionId,
        questionCode: response.question.questionCode,
        questionType: response.question.questionType.name,
        sectionName: response.question.questionType.pteSection.name,
        textResponse: response.textResponse,
        audioResponseUrl: response.audioResponseUrl,
        selectedOptions: response.selectedOptions,
        orderedItems: response.orderedItems,
        highlightedWords: response.highlightedWords,
        questionScore: response.questionScore,
        isCorrect: response.isCorrect,
        aiFeedback: response.aiFeedback,
        timeTakenSeconds: response.timeTakenSeconds,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
      }));

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          responses: formattedResponses,
          pagination: {
            currentPage: pageNumber,
            totalPages,
            totalResponses,
            hasNextPage,
            hasPrevPage,
            limit: limitNumber,
          },
        },
        'User responses retrieved successfully.'
      );
    } catch (error: any) {
      console.error('Get user responses error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while retrieving responses.'
      );
    }
  }
);

/**
 * @desc    Get user's response statistics
 * @route   GET /api/user/responses/stats
 * @access  Private (requires authentication)
 */
export const getUserResponseStats = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?.id;

    try {
      if (!userId) {
        return sendResponse(
          res,
          STATUS_CODES.UNAUTHORIZED,
          null,
          'Authentication required.'
        );
      }

      // Get overall stats
      const totalResponses = await prisma.userResponse.count({
        where: { userId },
      });

      const correctResponses = await prisma.userResponse.count({
        where: { userId, isCorrect: true },
      });

      // Get stats by question type
      const statsByType = await prisma.userResponse.groupBy({
        by: ['questionId'],
        where: { userId },
        _count: {
          id: true,
        },
        _avg: {
          questionScore: true,
        },
      });

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentResponses = await prisma.userResponse.count({
        where: {
          userId,
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
      });

      const accuracyRate = totalResponses > 0 ? (correctResponses / totalResponses) * 100 : 0;

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          totalResponses,
          correctResponses,
          accuracyRate: Math.round(accuracyRate * 100) / 100, // Round to 2 decimal places
          recentActivity: recentResponses,
          responsesByType: statsByType.length,
        },
        'User response statistics retrieved successfully.'
      );
    } catch (error: any) {
      console.error('Get user response stats error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while retrieving response statistics.'
      );
    }
  }
);
