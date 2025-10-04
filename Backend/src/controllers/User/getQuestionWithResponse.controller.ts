import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse, shuffleArray } from '../../utils/helpers';
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
      const responses = await prisma.userResponse.findMany({
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
        score: response.questionScore || 0,
        isCorrect: response.isCorrect,
        aiFeedback: response.aiFeedback,
        detailedAnalysis: response.detailedAnalysis,
        suggestions: [], // UserResponse doesn't have suggestions field
        timeTakenSeconds: response.timeTakenSeconds,
        createdAt: response.createdAt,
        transcribedText:
          typeof response.detailedAnalysis === 'object' &&
          response.detailedAnalysis !== null &&
          'transcribedText' in response.detailedAnalysis
            ? (response.detailedAnalysis as any).transcribedText
            : null,
      }));

      // Transform question data to match getPracticeQuestions format
      const transformedQuestion = {
        id: question.id,
        type: question.questionType.name,
        difficultyLevel: question.difficultyLevel,
        title: `${question.questionType.name} - ${question.questionCode}`,
        instructions: `Instructions for ${question.questionType.name}`, // You might want to add proper instructions
        content: {
          text: question.textContent,
          questionStatement: question.questionStatement,
          audioUrl,
          imageUrl: imageSignedUrl,
          options: question.options,
          paragraphs:
            question.questionType.name === 'RE_ORDER_PARAGRAPHS'
              ? transformParagraphsForReorder(
                  question.options,
                  question.correctAnswers
                )
              : undefined,
          blanks: question.questionType.name.includes('FILL_IN_THE_BLANKS')
            ? transformBlanksForFillIn(
                question.textContent!,
                question.correctAnswers,
                question.options,
                question.questionType.name
              )
            : undefined,
          wordLimit:
            question.wordCountMin && question.wordCountMax
              ? {
                  min: question.wordCountMin,
                  max: question.wordCountMax,
                }
              : undefined,
          timeLimit: question.durationMillis
            ? Math.floor(question.durationMillis / 1000)
            : undefined,
        },
        // Include raw question data for backward compatibility
        rawQuestion: {
          id: question.id,
          questionCode: question.questionCode,
          questionType: question.questionType.name,
          difficultyLevel: question.difficultyLevel,
          textContent: question.textContent,
          questionStatement: question.questionStatement,
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
      };

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          question: transformedQuestion,
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

// Helper functions for data transformation (copied from getPracticeQuestions)
function transformParagraphsForReorder(
  options?: any,
  correctAnswers?: any
): any[] | undefined {
  // If options contains paragraphs data (new format)
  if (options && Array.isArray(options) && options.length > 0) {
    // Check if it's the new paragraph format
    if (options[0].text && options[0].correctOrder !== undefined) {
      const transformed = shuffleArray(
        options.map((paragraph: any) => ({
          id: paragraph.id,
          text: paragraph.text,
          order: paragraph.correctOrder,
        }))
      );
      return transformed;
    }
  }

  // Fallback for old format or empty data
  return undefined;
}

function transformBlanksForFillIn(
  textContent?: string,
  correctAnswers?: any,
  options?: any,
  questionType?: string
): any[] | undefined {
  // If options contains blanks data (new format)
  if (options && Array.isArray(options) && options.length > 0) {
    // Check if it's the new blanks format
    if (options[0].correctAnswer !== undefined && options[0].options) {
      // For Reading Writing Fill in the Blanks (drag and drop), shuffle the options
      if (questionType === 'FILL_IN_THE_BLANKS_DRAG_AND_DROP') {
        return options.map((blank: any) => ({
          ...blank,
          options: shuffleArray([...blank.options]), // Shuffle options for each blank
        }));
      }
      return options;
    }
  }

  // Fallback for old format
  if (!textContent) return undefined;

  // Count blanks in text content
  const blankMatches = textContent.match(/___+/g);
  const blankCount = blankMatches ? blankMatches.length : 0;

  if (blankCount === 0) return undefined;

  // Fallback: create structure from correctAnswers (for backward compatibility)
  const answers = Array.isArray(correctAnswers)
    ? correctAnswers
    : typeof correctAnswers === 'object'
    ? Object.values(correctAnswers)
    : [correctAnswers];

  return Array.from({ length: blankCount }, (_, index) => ({
    id: `blank${index + 1}`,
    position: index + 1,
    options: [], // Empty options for backward compatibility
    correctAnswer: answers[index] || '',
  }));
}
