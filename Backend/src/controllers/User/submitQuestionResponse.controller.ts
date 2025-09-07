import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { evaluateQuestionResponse } from '../../services/questionEvaluationService';
import { CustomRequest } from '../../types';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';

/**
 * @desc    Submit and evaluate question response using OpenAI
 * @route   POST /api/user/questions/submit-response
 * @access  Private (requires authentication)
 */
export const submitQuestionResponse = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?.id;
    const { questionId, userResponse, timeTakenSeconds } = req.body;

    try {
      if (!userId) {
        return sendResponse(
          res,
          STATUS_CODES.UNAUTHORIZED,
          null,
          'Authentication required to submit responses.'
        );
      }

      // Validate required fields
      if (!questionId || !userResponse) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Question ID and user response are required.'
        );
      }

      // Validate ObjectId format
      if (questionId.length !== 24) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Invalid question ID format.'
        );
      }

      // Get question details with correct answers
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

      // Evaluate the response using OpenAI
      const evaluation = await evaluateQuestionResponse(
        question,
        userResponse,
        timeTakenSeconds
      );

      // Store the response and evaluation
      const responseRecord = await prisma.$transaction(async (tx) => {
        // Create user response record
        const userResponseRecord = await tx.userResponse.create({
          data: {
            userId,
            questionId,
            textResponse: userResponse.textResponse || null,
            audioResponseUrl: userResponse.audioResponseUrl || null,
            selectedOptions: userResponse.selectedOptions || [],
            orderedItems: userResponse.orderedItems || [],
            highlightedWords: userResponse.highlightedWords || [],
            questionScore: evaluation.score,
            isCorrect: evaluation.isCorrect,
            aiFeedback: evaluation.feedback,
            timeTakenSeconds: timeTakenSeconds || 0,
          },
        });

        // Update practice session for standalone question practice
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let practiceSession = await tx.practiceSession.findFirst({
          where: {
            userId,
            sessionDate: today,
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

        // Create practice response record
        await tx.practiceResponse.create({
          data: {
            userId,
            questionId,
            practiceSessionId: practiceSession.id,
            questionType: question.questionType.name,
            userResponse: userResponse,
            timeTakenSeconds: timeTakenSeconds || 0,
            isCorrect: evaluation.isCorrect,
            score: evaluation.score / 100, // Convert to 0-1 scale
          },
        });

        // Update practice session stats
        await tx.practiceSession.update({
          where: { id: practiceSession.id },
          data: {
            totalQuestions: { increment: 1 },
            correctAnswers: evaluation.isCorrect ? { increment: 1 } : undefined,
            totalTimeSpent: { increment: timeTakenSeconds || 0 },
          },
        });

        return userResponseRecord;
      });

      return sendResponse(
        res,
        STATUS_CODES.CREATED,
        {
          responseId: responseRecord.id,
          evaluation: {
            score: evaluation.score,
            isCorrect: evaluation.isCorrect,
            feedback: evaluation.feedback,
            detailedAnalysis: evaluation.detailedAnalysis,
            suggestions: evaluation.suggestions,
          },
          question: {
            id: question.id,
            questionCode: question.questionCode,
            questionType: question.questionType.name,
            sectionName: question.questionType.pteSection.name,
          },
          timeTaken: timeTakenSeconds || 0,
        },
        'Response submitted and evaluated successfully.'
      );
    } catch (error: any) {
      console.error('Submit question response error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while submitting your response. Please try again.'
      );
    }
  }
);
