import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import jwt from 'jsonwebtoken';

/**
 * @desc    Get list of questions for a question type (for sidebar)
 * @route   GET /api/user/question-list/:questionType
 * @access  Public (but shows different data if user is authenticated)
 */
export const getQuestionList = asyncHandler(
  async (req: Request, res: Response) => {
    const { questionType } = req.params;
    const { difficultyLevel, practiceStatus } = req.query;

    try {
      if (!questionType) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Question type is required.'
        );
      }

      // Try to get user ID from token if provided (optional authentication)
      let userId: string | undefined;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
          const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true },
          });
          if (user) {
            userId = user.id;
          }
        } catch (error) {
          // Invalid token, continue as unauthenticated user
        }
      }

      // Find the question type
      const questionTypeRecord = await prisma.questionType.findFirst({
        where: { name: questionType as any },
        include: {
          pteSection: true,
        },
      });

      if (!questionTypeRecord) {
        return sendResponse(
          res,
          STATUS_CODES.NOT_FOUND,
          null,
          'Question type not found.'
        );
      }

      // Build where clause
      const whereClause: any = {
        questionTypeId: questionTypeRecord.id,
      };

      // Add difficulty filter
      if (difficultyLevel && difficultyLevel !== 'all') {
        whereClause.difficultyLevel = difficultyLevel;
      }

      // Add practice status filter (only if user is authenticated)
      if (userId && practiceStatus && practiceStatus !== 'all') {
        if (practiceStatus === 'practiced') {
          // Questions that have user responses
          const practiceQuestionIds = await prisma.questionResponse.findMany({
            where: { userId },
            select: { questionId: true },
            distinct: ['questionId'],
          });

          if (practiceQuestionIds.length > 0) {
            whereClause.id = {
              in: practiceQuestionIds.map((pq) => pq.questionId),
            };
          } else {
            // No practiced questions, return empty result
            whereClause.id = 'non-existent-id';
          }
        } else if (practiceStatus === 'unpracticed') {
          // Questions that don't have user responses
          const practiceQuestionIds = await prisma.questionResponse.findMany({
            where: { userId },
            select: { questionId: true },
            distinct: ['questionId'],
          });

          if (practiceQuestionIds.length > 0) {
            whereClause.id = {
              notIn: practiceQuestionIds.map((pq) => pq.questionId),
            };
          }
        }
      }

      // Get questions with minimal data for list view
      const questions = await prisma.question.findMany({
        where: whereClause,
        select: {
          id: true,
          questionCode: true,
          difficultyLevel: true,
          createdAt: true,
          ...(userId && {
            questionResponses: {
              where: { userId },
              select: {
                id: true,
                score: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
            },
          }),
        },
        orderBy: { createdAt: 'desc' },
      });

      // Transform questions for list view
      const transformedQuestions = questions.map((question: any) => {
        const hasUserResponses = userId
          ? (question.questionResponses?.length || 0) > 0
          : false;
        const bestScore = hasUserResponses
          ? Math.max(...question.questionResponses.map((r: any) => r.score))
          : undefined;
        const lastAttemptedAt = hasUserResponses
          ? question.questionResponses[0].createdAt
          : undefined;

        return {
          id: question.id,
          questionCode: question.questionCode,
          difficultyLevel: question.difficultyLevel,
          hasUserResponses,
          lastAttemptedAt,
          bestScore,
          createdAt: question.createdAt,
        };
      });

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          questions: transformedQuestions,
          total: transformedQuestions.length,
        },
        `Retrieved ${transformedQuestions.length} questions successfully.`
      );
    } catch (error: any) {
      console.error('Get question list error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while fetching question list. Please try again.'
      );
    }
  }
);
