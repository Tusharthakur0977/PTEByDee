import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { SecureUrlService } from '../../services/secureUrlService';
import jwt from 'jsonwebtoken';

/**
 * @desc    Get question with user responses
 * @route   GET /api/user/questions/:questionId/responses
 * @access  Public (but requires authentication to see responses)
 */
export const getQuestionWithResponses = asyncHandler(
  async (req: Request, res: Response) => {
    const { questionId } = req.params;

    try {
      if (!questionId || questionId.length !== 24) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Invalid question ID format.'
        );
      }

      // Try to get user ID from token (required for this endpoint)
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
          // Invalid token
        }
      }

      if (!userId) {
        return sendResponse(
          res,
          STATUS_CODES.UNAUTHORIZED,
          null,
          'Authentication required to view response history.'
        );
      }

      // Get question details
      const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: {
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

      // Get user responses for this question
      const responses = await prisma.questionResponse.findMany({
        where: {
          userId,
          questionId,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Generate signed URLs for media content
      let audioUrl = null;
      let imageSignedUrl = null;

      // Generate signed URL for audio if it exists
      if (question.audioUrl && SecureUrlService.isConfigured()) {
        try {
          const signedUrlResponse =
            await SecureUrlService.generateSecureVideoUrl(question.audioUrl, {
              expirationHours: 24,
            });
          audioUrl = signedUrlResponse.signedUrl;
        } catch (error) {
          console.warn(
            `Failed to generate signed URL for audio ${question.audioUrl}:`,
            error
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
            await SecureUrlService.generateSecureImageUrl(question.imageUrl, {
              expirationHours: 24,
            });
          imageSignedUrl = signedUrlResponse.signedUrl;
        } catch (error) {
          console.warn(
            `Failed to generate signed URL for image ${question.imageUrl}:`,
            error
          );
          imageSignedUrl = question.imageUrl;
        }
      } else {
        imageSignedUrl = question.imageUrl;
      }

      // Transform response data
      const transformedResponses = responses.map((response) => ({
        id: response.id,
        score: response.score,
        isCorrect: response.isCorrect,
        aiFeedback: response.aiFeedback,
        detailedAnalysis: response.detailedAnalysis,
        suggestions: response.suggestions,
        timeTakenSeconds: response.timeTakenSeconds,
        createdAt: response.createdAt,
        transcribedText:
          typeof response.detailedAnalysis === 'object' &&
          response.detailedAnalysis !== null &&
          'transcribedText' in response.detailedAnalysis
            ? (response.detailedAnalysis as any).transcribedText
            : null,
      }));

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          question: {
            id: question.id,
            questionCode: question.questionCode,
            questionType: question.questionType.name,
            difficultyLevel: question.difficultyLevel,
            textContent: question.textContent,
            audioUrl,
            imageUrl: imageSignedUrl,
            options: question.options,
            correctAnswers: question.correctAnswers,
            wordCountMin: question.wordCountMin,
            wordCountMax: question.wordCountMax,
            durationMillis: question.durationMillis,
            originalTextWithErrors: question.originalTextWithErrors,
            incorrectWords: question.incorrectWords,
          },
          responses: transformedResponses,
          total: transformedResponses.length,
        },
        'Question responses retrieved successfully.'
      );
    } catch (error: any) {
      console.error('Get question with responses error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while fetching question responses. Please try again.'
      );
    }
  }
);
