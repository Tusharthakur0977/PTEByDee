import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { SecureUrlService } from '../../services/secureUrlService';

/**
 * @desc    Get all questions with pagination and filtering (Admin only)
 * @route   GET /api/admin/questions
 * @access  Private/Admin
 */
export const getAllQuestions = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const {
        page = '1',
        limit = '10',
        search = '',
        questionType,
        testId,
        sectionId,
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
            questionCode: {
              contains: search as string,
              mode: 'insensitive',
            },
          },
          {
            textContent: {
              contains: search as string,
              mode: 'insensitive',
            },
          },
        ];
      }

      // Filter by question type
      if (questionType) {
        whereClause.questionType = {
          name: questionType,
        };
      }

      // Filter by test
      if (testId) {
        whereClause.testId = testId;
      }

      // Filter by PTE section
      if (sectionId) {
        whereClause.questionType = {
          pteSectionId: sectionId,
        };
      }

      // Build orderBy clause
      const orderBy: any = {};
      orderBy[sortBy as string] = sortOrder as 'asc' | 'desc';

      // Get total count for pagination
      const totalQuestions = await prisma.question.count({
        where: whereClause,
      });

      // Get questions with related data
      const questions = await prisma.question.findMany({
        where: whereClause,
        include: {
          questionType: {
            include: {
              pteSection: true,
            },
          },
          // test: {
          //   select: {
          //     id: true,
          //     title: true,
          //     testType: true,
          //   },
          // },
          _count: {
            select: {
              UserResponse: true,
            },
          },
        },
        orderBy,
        skip,
        take: limitNumber,
      });

      // Transform questions to include signed URLs for audio and images
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
                  { expirationHours: 24 }
                );
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
                await SecureUrlService.generateSecureImageUrl(
                  question.imageUrl,
                  { expirationHours: 24 }
                );
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

          return {
            ...question,
            audioUrl,
            imageUrl: imageSignedUrl,
            responseCount: question._count.UserResponse,
          };
        })
      );

      // Calculate pagination info
      const totalPages = Math.ceil(totalQuestions / limitNumber);
      const hasNextPage = pageNumber < totalPages;
      const hasPrevPage = pageNumber > 1;

      const responseData = {
        questions: transformedQuestions,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalQuestions,
          hasNextPage,
          hasPrevPage,
          limit: limitNumber,
        },
        filters: {
          search: search as string,
          questionType: questionType as string,
          testId: testId as string,
          sectionId: sectionId as string,
          sortBy: sortBy as string,
          sortOrder: sortOrder as string,
        },
      };

      return sendResponse(
        res,
        STATUS_CODES.OK,
        responseData,
        `Retrieved ${transformedQuestions.length} questions successfully.`
      );
    } catch (error: any) {
      console.error('Get all questions error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while fetching questions. Please try again.'
      );
    }
  }
);
