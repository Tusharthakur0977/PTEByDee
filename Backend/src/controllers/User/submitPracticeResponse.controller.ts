import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { CustomRequest } from '../../types';

/**
 * @desc    Submit practice question response
 * @route   POST /api/user/practice/submit-response
 * @access  Private (requires authentication)
 */
export const submitPracticeResponse = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?.id;
    const {
      questionId,
      questionType,
      response,
      timeTaken, // in seconds
      isCorrect,
      score,
    } = req.body;

    try {
      if (!userId) {
        return sendResponse(
          res,
          STATUS_CODES.UNAUTHORIZED,
          null,
          'Authentication required to submit practice responses.'
        );
      }

      // Validate required fields
      if (!questionId || !questionType || !response) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Question ID, question type, and response are required.'
        );
      }

      // Validate ObjectId format for questionId
      if (questionId.length !== 24) {
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

      // Create a practice session record (we'll create a simple practice attempt model)
      const practiceAttempt = await prisma.$transaction(async (tx) => {
        // First, try to find or create a practice session for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let practiceSession = await tx.practiceSession.findFirst({
          where: {
            userId,
            createdAt: {
              gte: today,
              lt: tomorrow,
            },
          },
        });

        if (!practiceSession) {
          practiceSession = await tx.practiceSession.create({
            data: {
              userId,
              sessionDate: today,
              totalQuestions: 0,
              correctAnswers: 0,
              totalTimeSpent: 0,
            },
          });
        }

        // Create the practice response
        const practiceResponse = await tx.practiceResponse.create({
          data: {
            userId,
            questionId,
            practiceSessionId: practiceSession.id,
            questionType,
            userResponse: response,
            timeTakenSeconds: timeTaken || 0,
            isCorrect: isCorrect || false,
            score: score || 0,
          },
        });

        // Update practice session stats
        await tx.practiceSession.update({
          where: { id: practiceSession.id },
          data: {
            totalQuestions: { increment: 1 },
            correctAnswers: isCorrect ? { increment: 1 } : undefined,
            totalTimeSpent: { increment: timeTaken || 0 },
          },
        });

        return practiceResponse;
      });

      return sendResponse(
        res,
        STATUS_CODES.CREATED,
        {
          practiceResponse: practiceAttempt,
          questionId,
          questionType,
          isCorrect: isCorrect || false,
          score: score || 0,
          timeTaken: timeTaken || 0,
        },
        'Practice response submitted successfully.'
      );
    } catch (error: any) {
      console.error('Submit practice response error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while submitting practice response. Please try again.'
      );
    }
  }
);
