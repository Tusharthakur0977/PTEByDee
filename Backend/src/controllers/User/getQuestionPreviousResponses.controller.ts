import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { CustomRequest } from '../../types';
import { SecureUrlService } from '../../services/secureUrlService';

/**
 * @desc    Get user's previous responses for a specific question
 * @route   GET /api/user/questions/:questionId/previous-responses
 * @access  Private (requires authentication)
 */
export const getQuestionPreviousResponses = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?.id;
    const { questionId } = req.params;
    const {
      page = 1,
      limit = 10,
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

      // Validate questionId format
      if (!questionId || questionId.length !== 24) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Invalid question ID format.'
        );
      }

      // Verify question exists
      const question = await prisma.question.findUnique({
        where: { id: questionId },
        select: {
          id: true,
          questionCode: true,
          questionType: {
            include: {
              pteSection: true,
            },
          },
        },
      });

      if (!question) {
        return sendResponse(
          res,
          STATUS_CODES.NOT_FOUND,
          null,
          'Question not found.'
        );
      }

      // Parse pagination parameters
      const pageNumber = Math.max(1, parseInt(page as string, 10));
      const limitNumber = Math.min(
        50,
        Math.max(1, parseInt(limit as string, 10))
      );
      const skip = (pageNumber - 1) * limitNumber;

      // Get total count of responses for this question by this user
      const totalResponses = await prisma.userResponse.count({
        where: {
          userId,
          questionId,
        },
      });

      // Get user responses for this specific question
      const responses = await prisma.userResponse.findMany({
        where: {
          userId,
          questionId,
        },
        orderBy: {
          [sortBy as string]: sortOrder as 'asc' | 'desc',
        },
        skip,
        take: limitNumber,
      });

      // Format responses for frontend
      const formattedResponses = await Promise.all(
        responses.map(async (response) => {
          // Generate secure URLs for audio responses if they exist
          let secureAudioUrl = null;
          if (response.audioResponseUrl) {
            try {
              const secureUrlResponse =
                await SecureUrlService.generateSecureAudioUrl(
                  response.audioResponseUrl,
                  { expirationHours: 24 }
                );
              secureAudioUrl = secureUrlResponse.signedUrl;
            } catch (error) {
              console.error('Error generating secure audio URL:', error);
            }
          }

          return {
            id: response.id,
            textResponse: response.textResponse,
            audioResponseUrl: secureAudioUrl,
            selectedOptions: response.selectedOptions,
            orderedItems: response.orderedItems,
            highlightedWords: response.highlightedWords,
            questionScore: response.questionScore,
            isCorrect: response.isCorrect,
            aiFeedback: response.aiFeedback,
            detailedAnalysis: response.detailedAnalysis,
            timeTakenSeconds: response.timeTakenSeconds,
            createdAt: response.createdAt,
            updatedAt: response.updatedAt,
          };
        })
      );

      // Calculate pagination info
      const totalPages = Math.ceil(totalResponses / limitNumber);
      const hasNextPage = pageNumber < totalPages;
      const hasPrevPage = pageNumber > 1;

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          question: {
            id: question.id,
            questionCode: question.questionCode,
            questionType: question.questionType.name,
            sectionName: question.questionType.pteSection.name,
          },
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
        'Previous responses retrieved successfully.'
      );
    } catch (error: any) {
      console.error('Get question previous responses error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while retrieving previous responses.'
      );
    }
  }
);

/**
 * @desc    Get summary statistics for user's responses to a specific question
 * @route   GET /api/user/questions/:questionId/response-stats
 * @access  Private (requires authentication)
 */
export const getQuestionResponseStats = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?.id;
    const { questionId } = req.params;

    try {
      if (!userId) {
        return sendResponse(
          res,
          STATUS_CODES.UNAUTHORIZED,
          null,
          'Authentication required.'
        );
      }

      // Validate questionId format
      if (!questionId || questionId.length !== 24) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Invalid question ID format.'
        );
      }

      // Get response statistics
      const totalAttempts = await prisma.userResponse.count({
        where: { userId, questionId },
      });

      const correctAttempts = await prisma.userResponse.count({
        where: { userId, questionId, isCorrect: true },
      });

      const averageScore = await prisma.userResponse.aggregate({
        where: { userId, questionId },
        _avg: { questionScore: true },
      });

      const bestScore = await prisma.userResponse.aggregate({
        where: { userId, questionId },
        _max: { questionScore: true },
      });

      const averageTime = await prisma.userResponse.aggregate({
        where: { userId, questionId },
        _avg: { timeTakenSeconds: true },
      });

      // Get first and last attempt dates
      const firstAttempt = await prisma.userResponse.findFirst({
        where: { userId, questionId },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      });

      const lastAttempt = await prisma.userResponse.findFirst({
        where: { userId, questionId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          totalAttempts,
          correctAttempts,
          accuracy:
            totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0,
          averageScore: averageScore._avg.questionScore || 0,
          bestScore: bestScore._max.questionScore || 0,
          averageTimeSeconds: averageTime._avg.timeTakenSeconds || 0,
          firstAttemptDate: firstAttempt?.createdAt,
          lastAttemptDate: lastAttempt?.createdAt,
        },
        'Question response statistics retrieved successfully.'
      );
    } catch (error: any) {
      console.error('Get question response stats error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while retrieving response statistics.'
      );
    }
  }
);
