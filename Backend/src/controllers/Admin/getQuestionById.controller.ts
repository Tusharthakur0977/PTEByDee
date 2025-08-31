import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { SecureUrlService } from '../../services/secureUrlService';

/**
 * @desc    Get a single question by ID with full details (Admin only)
 * @route   GET /api/admin/questions/:id
 * @access  Private/Admin
 */
export const getQuestionById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      // Validate ObjectId format
      if (!id || id.length !== 24) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Invalid question ID format.'
        );
      }

      const question = await prisma.question.findUnique({
        where: { id },
        include: {
          questionType: {
            include: {
              pteSection: true,
            },
          },
          test: {
            select: {
              id: true,
              title: true,
              description: true,
              testType: true,
              totalDuration: true,
              isFree: true,
            },
          },
          UserResponse: {
            include: {
              testAttempt: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 10, // Latest 10 responses
          },
          _count: {
            select: {
              UserResponse: true,
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

      // Calculate response statistics
      const responseStats = {
        totalResponses: question._count.UserResponse,
        uniqueUsers: new Set(
          question.UserResponse.map((r) => r.testAttempt.userId)
        ).size,
        averageScore:
          question.UserResponse.length > 0
            ? question.UserResponse.filter(
                (r) => r.questionScore !== null
              ).reduce((sum, r) => sum + (r.questionScore || 0), 0) /
              question.UserResponse.filter((r) => r.questionScore !== null)
                .length
            : 0,
        correctResponses: question.UserResponse.filter(
          (r) => r.isCorrect === true
        ).length,
      };

      const responseData = {
        ...question,
        audioUrl,
        imageUrl: imageSignedUrl,
        responseStats,
        recentResponses: question.UserResponse.slice(0, 5), // Latest 5 responses
      };

      return sendResponse(
        res,
        STATUS_CODES.OK,
        responseData,
        'Question details retrieved successfully.'
      );
    } catch (error: any) {
      console.error('Get question by ID error:', error);

      if (error.code === 'P2025') {
        return sendResponse(
          res,
          STATUS_CODES.NOT_FOUND,
          null,
          'Question not found.'
        );
      }

      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while fetching the question. Please try again.'
      );
    }
  }
);
