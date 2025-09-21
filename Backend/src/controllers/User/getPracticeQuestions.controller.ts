import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { SecureUrlService } from '../../services/secureUrlService';

/**
 * @desc    Get practice questions by question type for portal exercises
 * @route   GET /api/user/practice-questions/:questionType
 * @access  Public
 */
export const getPracticeQuestions = asyncHandler(
  async (req: Request, res: Response) => {
    const { questionType } = req.params;
    const { limit = '10', random = 'true' } = req.query;

    try {
      if (!questionType) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Question type is required.'
        );
      }

      const limitNumber = parseInt(limit as string, 10);

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

      // Get questions for this type
      let questions;
      if (random === 'true') {
        // Get random questions
        const totalQuestions = await prisma.question.count({
          where: {
            questionTypeId: questionTypeRecord.id,
          },
        });

        if (totalQuestions === 0) {
          return sendResponse(
            res,
            STATUS_CODES.OK,
            {
              questions: [],
              questionType: questionTypeRecord,
              total: 0,
            },
            'No practice questions available for this type yet.'
          );
        }

        // Generate random skip value
        const maxSkip = Math.max(0, totalQuestions - limitNumber);
        const randomSkip = Math.floor(Math.random() * (maxSkip + 1));

        questions = await prisma.question.findMany({
          where: {
            questionTypeId: questionTypeRecord.id,
          },
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
          },
          skip: randomSkip,
          take: limitNumber,
        });
      } else {
        // Get questions in order
        questions = await prisma.question.findMany({
          where: {
            questionTypeId: questionTypeRecord.id,
          },
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
          },
          // orderBy: { orderInTest: 'asc' },
          take: limitNumber,
        });
      }

      // Transform questions to include signed URLs and format for practice
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

          // Transform to practice question format
          return {
            id: question.id,
            type: question.questionType.name,
            title: `${formatQuestionTypeName(question.questionType.name)} - ${
              question.questionCode
            }`,
            instructions: getInstructionsForQuestionType(
              question.questionType.name
            ),
            content: {
              text: question.textContent,
              audioUrl,
              imageUrl: imageSignedUrl,
              options: question.options,
              paragraphs:
                question.questionType.name === 'RE_ORDER_PARAGRAPHS'
                  ? transformParagraphsForReorder(
                      question.textContent!,
                      question.correctAnswers
                    )
                  : undefined,
              blanks: question.questionType.name.includes('FILL_IN_THE_BLANKS')
                ? transformBlanksForFillIn(
                    question.textContent!,
                    question.correctAnswers
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
              preparationTime: getPreparationTime(question.questionType.name),
              recordingTime: getRecordingTime(
                question.questionType.name,
                question.durationMillis!
              ),
            },
          };
        })
      );

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          questions: transformedQuestions,
          questionType: questionTypeRecord,
          total: transformedQuestions.length,
        },
        `Retrieved ${transformedQuestions.length} practice questions successfully.`
      );
    } catch (error: any) {
      console.error('Get practice questions error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while fetching practice questions. Please try again.'
      );
    }
  }
);

// Helper functions
function formatQuestionTypeName(name: string): string {
  return name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function getInstructionsForQuestionType(questionType: string): string {
  const instructions: { [key: string]: string } = {
    READ_ALOUD:
      'Look at the text below. In 40 seconds, you must read this text aloud as naturally and clearly as possible. You have 40 seconds to read aloud.',
    REPEAT_SENTENCE:
      'You will hear a sentence. Please repeat the sentence exactly as you hear it. You will hear the sentence only once.',
    DESCRIBE_IMAGE:
      'Look at the image below. In 25 seconds, please speak into the microphone and describe in detail what the image is showing. You will have 40 seconds to give your response.',
    RE_TELL_LECTURE:
      'You will hear a lecture. After listening to the lecture, in 10 seconds, please speak into the microphone and retell what you have just heard from the lecture in your own words. You will have 40 seconds to give your response.',
    ANSWER_SHORT_QUESTION:
      'You will hear a question. Please give a simple and short answer. Often just one or a few words is enough.',
    SUMMARIZE_WRITTEN_TEXT:
      'Read the passage below and summarize it using one sentence. Type your response in the box at the bottom of the screen. You have 10 minutes to finish this task. Your response will be judged on the quality of your writing and on how well your response presents the key points in the passage.',
    WRITE_ESSAY:
      'You will have 20 minutes to plan, write and revise an essay about the topic below. Your response will be judged on how well you develop a position, organize your ideas, present supporting details, and control the elements of standard written English. You should write 200-300 words.',
    MULTIPLE_CHOICE_SINGLE_ANSWER_READING:
      'Read the text and answer the multiple-choice question by selecting the correct response. Only one response is correct.',
    MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING:
      'Read the text and answer the question by selecting all the correct responses. You will need to select more than one response.',
    RE_ORDER_PARAGRAPHS:
      'The text boxes in the left panel have been placed in a random order. Restore the original order by dragging the text boxes from the left panel to the right panel.',
    READING_FILL_IN_THE_BLANKS:
      'Below is a text with blanks. Click on each blank, a list of choices will appear. Select the appropriate answer choice for each blank.',
    READING_WRITING_FILL_IN_THE_BLANKS:
      'In the text below some words are missing. Drag words from the box below to the appropriate place in the text. To undo an answer choice, drag the word back to the box below the text.',
    SUMMARIZE_SPOKEN_TEXT:
      'You will hear a lecture. Write a summary for a fellow student who was not present at the lecture. You should write 50-70 words. You have 10 minutes to finish this task.',
    MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING:
      'Listen to the recording and answer the multiple-choice question by selecting the correct response. Only one response is correct.',
    MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING:
      'Listen to the recording and answer the question by selecting all the correct responses. You will need to select more than one response.',
    LISTENING_FILL_IN_THE_BLANKS:
      'You will hear a recording. Type the missing words in each blank as you listen.',
    HIGHLIGHT_CORRECT_SUMMARY:
      'You will hear a recording. Click on the paragraph that best relates to the recording.',
    SELECT_MISSING_WORD:
      'You will hear a recording about a topic. At the end of the recording the last word or group of words has been replaced by a beep. Select the correct option to complete the recording.',
    HIGHLIGHT_INCORRECT_WORDS:
      'You will hear a recording. Below is a transcription of the recording. Some words in the transcription differ from what the speaker said. Please click on the words that are different.',
    WRITE_FROM_DICTATION:
      'You will hear a sentence. Type the sentence in the box below exactly as you hear it. Write as much of the sentence as you can. You will hear the sentence only once.',
  };

  return (
    instructions[questionType] ||
    'Follow the instructions for this question type.'
  );
}

function getPreparationTime(questionType: string): number | undefined {
  const preparationTimes: { [key: string]: number } = {
    READ_ALOUD: 3,
    DESCRIBE_IMAGE: 25,
    RE_TELL_LECTURE: 10,
  };

  return preparationTimes[questionType];
}

function getRecordingTime(
  questionType: string,
  durationMillis?: number
): number | undefined {
  if (durationMillis) {
    return Math.floor(durationMillis / 1000);
  }

  const recordingTimes: { [key: string]: number } = {
    READ_ALOUD: 40,
    REPEAT_SENTENCE: 15,
    DESCRIBE_IMAGE: 40,
    RE_TELL_LECTURE: 40,
    ANSWER_SHORT_QUESTION: 10,
  };

  return recordingTimes[questionType];
}

function transformParagraphsForReorder(
  textContent?: string,
  correctAnswers?: any
): any[] | undefined {
  if (!textContent || !correctAnswers) return undefined;

  // Split text into paragraphs and create reorder structure
  const paragraphs = textContent.split('\n\n').filter((p) => p.trim());

  return paragraphs.map((text, index) => ({
    id: `p${index + 1}`,
    text: text.trim(),
    order: index + 1,
  }));
}

function transformBlanksForFillIn(
  textContent?: string,
  correctAnswers?: any
): any[] | undefined {
  if (!textContent || !correctAnswers) return undefined;

  // Count blanks in text and create structure
  const blankCount = (textContent.match(/_____/g) || []).length;
  const answers = Array.isArray(correctAnswers)
    ? correctAnswers
    : [correctAnswers];

  return Array.from({ length: blankCount }, (_, index) => ({
    id: `blank${index + 1}`,
    position: index + 1,
    options: [], // Would need to be configured separately
    correctAnswer: answers[index] || '',
  }));
}
