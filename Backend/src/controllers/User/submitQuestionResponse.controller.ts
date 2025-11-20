import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { evaluateQuestionResponse } from '../../services/questionEvaluationService';
import {
  transcribeAudioWithRetry,
  validateAudioFile,
} from '../../services/audioTranscriptionService';
import { CustomRequest } from '../../types';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { PteQuestionTypeName } from '@prisma/client';

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

      console.log('USER RESPONSE:', userResponse);

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

      // Handle audio transcription for speaking questions
      let processedUserResponse = userResponse;
      let transcribedText: string | null = null;

      // Check if this is an audio-based question that needs transcription
      const audioBasedQuestions = [
        PteQuestionTypeName.READ_ALOUD,
        PteQuestionTypeName.REPEAT_SENTENCE,
        PteQuestionTypeName.DESCRIBE_IMAGE,
        PteQuestionTypeName.RE_TELL_LECTURE,
        PteQuestionTypeName.ANSWER_SHORT_QUESTION,
        PteQuestionTypeName.SUMMARIZE_GROUP_DISCUSSION,
        PteQuestionTypeName.RESPOND_TO_A_SITUATION,
      ];

      if (audioBasedQuestions.includes(question.questionType.name as any)) {
        // Check if audio response is provided
        if (userResponse.audioResponseUrl) {
          console.log(
            'Audio response URL provided:',
            userResponse.audioResponseUrl
          );

          // Validate audio file
          if (!validateAudioFile(userResponse.audioResponseUrl)) {
            return sendResponse(
              res,
              STATUS_CODES.BAD_REQUEST,
              null,
              'Invalid audio file format or location. Please record your response again.'
            );
          }

          try {
            console.log('Starting audio transcription...');
            // Transcribe audio using OpenAI Whisper (pass S3 key, not signed URL)
            const transcriptionResult = await transcribeAudioWithRetry(
              userResponse.audioResponseUrl
            );
            transcribedText = transcriptionResult.text;

            // For evaluation, pass the transcribed text
            processedUserResponse = {
              ...userResponse,
              textResponse: transcribedText,
            };
          } catch (error: any) {
            console.error('Audio transcription failed:', error);
            return sendResponse(
              res,
              STATUS_CODES.INTERNAL_SERVER_ERROR,
              null,
              `Audio transcription failed: ${error.message}. Please try recording again or contact support if the issue persists.`
            );
          }
        } else {
          return sendResponse(
            res,
            STATUS_CODES.BAD_REQUEST,
            null,
            'Audio response is required for this question type.'
          );
        }
      }

      // Evaluate the response using OpenAI
      const evaluation = await evaluateQuestionResponse(
        question,
        processedUserResponse,
        timeTakenSeconds
      );

      console.log(evaluation, 'MNMNMNMNM');

      // Store the response and evaluation
      const responseRecord = await prisma.$transaction(async (tx) => {
        // Create user response record
        const userResponseRecord = await tx.userResponse.create({
          data: {
            userId,
            questionId,
            textResponse: transcribedText || userResponse.textResponse || null,
            audioResponseUrl: userResponse.audioResponseUrl || null,
            selectedOptions: userResponse.selectedOptions || [],
            orderedItems: userResponse.orderedItems || [],
            highlightedWords: userResponse.highlightedWords || [],
            questionScore: evaluation.score,
            isCorrect: evaluation.isCorrect,
            aiFeedback:
              typeof evaluation.feedback === 'string'
                ? evaluation.feedback
                : JSON.stringify(
                    evaluation.feedback || 'Response evaluated successfully.'
                  ),
            detailedAnalysis: evaluation.detailedAnalysis || null,
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
        // Only create practice response if we have a valid practice session
        if (practiceSession) {
          await tx.practiceResponse.create({
            data: {
              userId,
              questionId,
              practiceSessionId: practiceSession.id,
              questionType: question.questionType.name,
              userResponse: userResponse,
              timeTakenSeconds: timeTakenSeconds || 0,
              isCorrect: evaluation.isCorrect,
              score: evaluation.score,
            },
          });
        }

        // Update practice session stats
        if (practiceSession) {
          await tx.practiceSession.update({
            where: { id: practiceSession.id },
            data: {
              totalQuestions: { increment: 1 },
              correctAnswers: evaluation.isCorrect
                ? { increment: 1 }
                : undefined,
              totalTimeSpent: { increment: timeTakenSeconds || 0 },
            },
          });
        }

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
            suggestions: evaluation.suggestions || [],
          },
          question: {
            id: question.id,
            questionCode: question.questionCode,
            questionType: question.questionType.name,
            sectionName: question.questionType.pteSection.name,
          },
          timeTaken: timeTakenSeconds || 0,
          transcribedText: transcribedText, // Include transcribed text for frontend display
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
