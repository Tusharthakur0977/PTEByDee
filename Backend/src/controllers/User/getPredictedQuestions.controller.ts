import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { SecureUrlService } from '../../services/secureUrlService';

/**
 * @desc    Get predicted questions for the portal (grouped by question type)
 * @route   GET /api/user/predicted-questions
 * @access  Public
 */
export const getPredictedQuestions = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      predictionLevel,
      questionType,
      limit = '100',
      page = '1',
    } = req.query;

    try {
      const limitNumber = parseInt(limit as string, 10);
      const pageNumber = parseInt(page as string, 10);
      const skip = (pageNumber - 1) * limitNumber;

      // Build where clause - only fetch questions with a prediction level set (not NONE)
      const whereClause: any = {
        isArchived: false,
        predictionLevel: { not: 'NONE' },
      };

      // Filter by specific prediction level
      if (predictionLevel && predictionLevel !== 'ALL') {
        whereClause.predictionLevel = predictionLevel;
      }

      // Filter by question type
      if (questionType) {
        whereClause.questionType = {
          name: questionType,
        };
      }

      // Get total count
      const totalCount = await prisma.question.count({
        where: whereClause,
      });

      // Fetch questions with related data
      const questions = await prisma.question.findMany({
        where: whereClause,
        include: {
          questionType: {
            include: {
              pteSection: true,
            },
          },
        },
        orderBy: [
          { predictionLevel: 'desc' }, // HIGH first, then MEDIUM, then LOW
          { createdAt: 'desc' },
        ],
        skip,
        take: limitNumber,
      });

      // Transform questions with signed URLs
      const transformedQuestions = await Promise.all(
        questions.map(async (question) => {
          let audioUrl = null;
          let imageSignedUrl = null;

          // Generate signed URL for audio if it exists
          if (question.audioUrl && SecureUrlService.isConfigured()) {
            try {
              const signedUrlResponse =
                await SecureUrlService.generateSecureVideoUrl(
                  question.audioUrl,
                  { expirationHours: 24 },
                );
              audioUrl = signedUrlResponse.signedUrl;
            } catch (error) {
              console.warn(
                `Failed to generate signed URL for audio ${question.audioUrl}:`,
                error,
              );
              audioUrl = question.audioUrl;
            }
          } else {
            audioUrl = question.audioUrl;
          }

          // Generate signed URL for image if it exists
          if (question.imageUrl && SecureUrlService.isConfigured()) {
            try {
              const signedUrlResponse =
                await SecureUrlService.generateSecureImageUrl(
                  question.imageUrl,
                  { expirationHours: 24 },
                );
              imageSignedUrl = signedUrlResponse.signedUrl;
            } catch (error) {
              console.warn(
                `Failed to generate signed URL for image ${question.imageUrl}:`,
                error,
              );
              imageSignedUrl = question.imageUrl;
            }
          } else {
            imageSignedUrl = question.imageUrl;
          }

          return {
            id: question.id,
            questionCode: question.questionCode,
            predictionLevel: question.predictionLevel,
            difficultyLevel: question.difficultyLevel,
            textContent: question.textContent,
            questionStatement: question.questionStatement,
            audioUrl,
            imageUrl: imageSignedUrl,
            tags: question.tags,
            createdAt: question.createdAt,
            questionType: {
              id: question.questionType.id,
              name: question.questionType.name,
              description: question.questionType.description,
              pteSection: question.questionType.pteSection,
            },
          };
        }),
      );

      // Group questions by question type for easy frontend rendering
      const groupedByType: { [key: string]: any } = {};
      transformedQuestions.forEach((q) => {
        const typeName = q.questionType.name;
        if (!groupedByType[typeName]) {
          groupedByType[typeName] = {
            questionType: q.questionType,
            questions: [],
          };
        }
        groupedByType[typeName].questions.push(q);
      });

      // Calculate pagination
      const totalPages = Math.ceil(totalCount / limitNumber);

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          questions: transformedQuestions,
          groupedByType,
          total: totalCount,
          pagination: {
            currentPage: pageNumber,
            totalPages,
            totalQuestions: totalCount,
            hasNextPage: pageNumber < totalPages,
            hasPrevPage: pageNumber > 1,
            limit: limitNumber,
          },
        },
        `Retrieved ${transformedQuestions.length} predicted questions successfully.`,
      );
    } catch (error: any) {
      console.error('Get predicted questions error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while fetching predicted questions. Please try again.',
      );
    }
  },
);
