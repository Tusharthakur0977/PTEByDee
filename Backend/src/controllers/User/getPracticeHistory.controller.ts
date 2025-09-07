import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { CustomRequest } from '../../types';

/**
 * @desc    Get user's practice history
 * @route   GET /api/user/practice/history
 * @access  Private (requires authentication)
 */
export const getPracticeHistory = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?.id;
    const {
      page = '1',
      limit = '20',
      questionType,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    try {
      if (!userId) {
        return sendResponse(
          res,
          STATUS_CODES.UNAUTHORIZED,
          null,
          'Authentication required to view practice history.'
        );
      }

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);
      const skip = (pageNumber - 1) * limitNumber;

      // Build where clause
      const whereClause: any = { userId };

      if (questionType) {
        whereClause.questionType = questionType;
      }

      if (dateFrom || dateTo) {
        whereClause.createdAt = {};
        if (dateFrom) {
          whereClause.createdAt.gte = new Date(dateFrom as string);
        }
        if (dateTo) {
          whereClause.createdAt.lte = new Date(dateTo as string);
        }
      }

      // Get total count
      const totalResponses = await prisma.practiceResponse.count({
        where: whereClause,
      });

      // Get practice responses with question details
      const practiceResponses = await prisma.practiceResponse.findMany({
        where: whereClause,
        include: {
          question: {
            select: {
              id: true,
              questionCode: true,
              textContent: true,
              imageUrl: true,
              audioUrl: true,
              correctAnswers: true,
              questionType: {
                include: {
                  pteSection: true,
                },
              },
            },
          },
          practiceSession: {
            select: {
              id: true,
              sessionDate: true,
            },
          },
        },
        orderBy: {
          [sortBy as string]: sortOrder as 'asc' | 'desc',
        },
        skip,
        take: limitNumber,
      });

      // Calculate pagination
      const totalPages = Math.ceil(totalResponses / limitNumber);
      const hasNextPage = pageNumber < totalPages;
      const hasPrevPage = pageNumber > 1;

      // Transform responses for frontend
      const transformedResponses = practiceResponses.map((response) => ({
        id: response.id,
        questionId: response.questionId,
        questionCode: response.question.questionCode,
        questionType: response.questionType,
        questionTypeName: response.question.questionType.name
          .split('_')
          .map(
            (word: string) =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .join(' '),
        sectionName: response.question.questionType.pteSection.name,
        userResponse: response.userResponse,
        correctAnswer: response.question.correctAnswers,
        isCorrect: response.isCorrect,
        score: response.score,
        timeTakenSeconds: response.timeTakenSeconds,
        createdAt: response.createdAt,
        sessionDate: response.practiceSession.sessionDate,
        questionPreview: {
          textContent: response.question.textContent?.substring(0, 100) + '...',
          hasAudio: !!response.question.audioUrl,
          hasImage: !!response.question.imageUrl,
        },
      }));

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          responses: transformedResponses,
          pagination: {
            currentPage: pageNumber,
            totalPages,
            totalResponses,
            hasNextPage,
            hasPrevPage,
            limit: limitNumber,
          },
          filters: {
            questionType: questionType as string,
            dateFrom: dateFrom as string,
            dateTo: dateTo as string,
            sortBy: sortBy as string,
            sortOrder: sortOrder as string,
          },
        },
        'Practice history retrieved successfully.'
      );
    } catch (error: any) {
      console.error('Get practice history error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while fetching practice history. Please try again.'
      );
    }
  }
);
