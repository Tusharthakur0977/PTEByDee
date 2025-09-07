import { PteQuestionTypeName } from '@prisma/client';
import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { CustomRequest } from '../../types';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { generateQuestionCode } from '../../utils/questionCodeGenerator';

/**
 * @desc    Create a new PTE question
 * @route   POST /api/admin/questions
 * @access  Private/Admin
 */
export const createQuestion = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const {
      questionCode: providedQuestionCode, // Allow optional manual override
      questionTypeId,
      // testId,
      // orderInTest,
      textContent,
      audioKey,
      imageUrl,
      options,
      correctAnswers,
      wordCountMin,
      wordCountMax,
      durationMillis,
      originalTextWithErrors,
      incorrectWords,
    } = req.body;

    try {
      // Input validation
      if (!questionTypeId) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Question type ID is required.'
        );
      }

      // Validate ObjectId formats
      if (questionTypeId.length !== 24) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Invalid question type ID'
        );
      }

      // Generate question code automatically or use provided one
      let questionCode: string;
      if (providedQuestionCode && providedQuestionCode.trim()) {
        // If question code is provided, check if it already exists
        const existingQuestion = await prisma.question.findUnique({
          where: { questionCode: providedQuestionCode.trim() },
        });

        if (existingQuestion) {
          return sendResponse(
            res,
            STATUS_CODES.CONFLICT,
            null,
            'Question code already exists. Please use a unique code.'
          );
        }
        questionCode = providedQuestionCode.trim();
      } else {
        // Generate automatic question code
        questionCode = await generateQuestionCode(questionTypeId);
      }

      // Verify question type exists
      const questionType = await prisma.questionType.findUnique({
        where: { id: questionTypeId },
      });

      if (!questionType) {
        return sendResponse(
          res,
          STATUS_CODES.NOT_FOUND,
          null,
          'Question type not found.'
        );
      }

      // Verify test exists
      // const test = await prisma.test.findUnique({
      //   where: { id: testId },
      // });

      // if (!test) {
      //   return sendResponse(
      //     res,
      //     STATUS_CODES.NOT_FOUND,
      //     null,
      //     'Test not found.'
      //   );
      // }

      // Validate question content based on question type
      const validationResult = validateQuestionContent(questionType.name, {
        textContent,
        audioKey,
        imageUrl,
        options,
        correctAnswers,
        wordCountMin,
        wordCountMax,
        durationMillis,
        originalTextWithErrors,
        incorrectWords,
      });

      if (!validationResult.isValid) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          validationResult.message
        );
      }

      // Create the question
      const question = await prisma.question.create({
        data: {
          questionCode,
          questionTypeId,
          // testId,
          // orderInTest: orderInTest || 1,
          textContent: textContent || null,
          audioUrl: audioKey || null, // Store S3 key in audioUrl field
          imageUrl: imageUrl || null,
          options: options || null,
          correctAnswers: correctAnswers || null,
          wordCountMin: wordCountMin || null,
          wordCountMax: wordCountMax || null,
          durationMillis: durationMillis || null,
          originalTextWithErrors: originalTextWithErrors || null,
          incorrectWords: incorrectWords || null,
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
          //   },
          // },
        },
      });

      return sendResponse(
        res,
        STATUS_CODES.CREATED,
        question,
        'Question created successfully.'
      );
    } catch (error: any) {
      console.error('Create question error:', error);

      if (error.code === 'P2002') {
        return sendResponse(
          res,
          STATUS_CODES.CONFLICT,
          null,
          'Question code already exists.'
        );
      }

      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while creating the question. Please try again.'
      );
    }
  }
);

/**
 * Validate question content based on question type
 */
function validateQuestionContent(
  questionType: PteQuestionTypeName,
  content: any
): { isValid: boolean; message: string } {
  const {
    textContent,
    audioKey,
    imageUrl,
    options,
    correctAnswers,
    wordCountMin,
    wordCountMax,
    originalTextWithErrors,
    incorrectWords,
  } = content;

  switch (questionType) {
    case 'READ_ALOUD':
      if (!textContent) {
        return {
          isValid: false,
          message: 'Text content is required for Read Aloud questions.',
        };
      }
      break;

    case 'REPEAT_SENTENCE':
    case 'RE_TELL_LECTURE':
    case 'ANSWER_SHORT_QUESTION':
      if (!audioKey) {
        return {
          isValid: false,
          message: 'Audio file is required for this question type.',
        };
      }
      break;

    case 'DESCRIBE_IMAGE':
      if (!imageUrl) {
        return {
          isValid: false,
          message: 'Image is required for Describe Image questions.',
        };
      }
      break;

    case 'SUMMARIZE_WRITTEN_TEXT':
    case 'WRITE_ESSAY':
      if (!textContent) {
        return {
          isValid: false,
          message: 'Text content is required for this question type.',
        };
      }
      if (!wordCountMin || !wordCountMax) {
        return {
          isValid: false,
          message: 'Word count limits are required for writing questions.',
        };
      }
      break;

    case 'MULTIPLE_CHOICE_SINGLE_ANSWER_READING':
    case 'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING':
    case 'MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING':
    case 'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING':
      if (!textContent && !audioKey) {
        return {
          isValid: false,
          message:
            'Text content or audio is required for multiple choice questions.',
        };
      }
      if (!options || !Array.isArray(options) || options.length < 2) {
        return {
          isValid: false,
          message:
            'At least 2 options are required for multiple choice questions.',
        };
      }
      if (!correctAnswers) {
        return {
          isValid: false,
          message:
            'Correct answers are required for multiple choice questions.',
        };
      }
      break;

    case 'READING_FILL_IN_THE_BLANKS':
    case 'READING_WRITING_FILL_IN_THE_BLANKS':
    case 'LISTENING_FILL_IN_THE_BLANKS':
      if (!textContent && !audioKey) {
        return {
          isValid: false,
          message:
            'Text content or audio is required for fill in the blanks questions.',
        };
      }
      if (!correctAnswers) {
        return {
          isValid: false,
          message:
            'Correct answers are required for fill in the blanks questions.',
        };
      }
      break;

    case 'RE_ORDER_PARAGRAPHS':
      if (!textContent) {
        return {
          isValid: false,
          message:
            'Text content is required for Re-order Paragraphs questions.',
        };
      }
      if (!correctAnswers) {
        return {
          isValid: false,
          message:
            'Correct order is required for Re-order Paragraphs questions.',
        };
      }
      break;

    case 'HIGHLIGHT_INCORRECT_WORDS':
      if (!originalTextWithErrors) {
        return {
          isValid: false,
          message:
            'Original text with errors is required for Highlight Incorrect Words questions.',
        };
      }
      if (!incorrectWords || !Array.isArray(incorrectWords)) {
        return {
          isValid: false,
          message:
            'Incorrect words array is required for Highlight Incorrect Words questions.',
        };
      }
      break;

    case 'SUMMARIZE_SPOKEN_TEXT':
    case 'WRITE_FROM_DICTATION':
      if (!audioKey) {
        return {
          isValid: false,
          message: 'Audio file is required for this question type.',
        };
      }
      break;

    case 'HIGHLIGHT_CORRECT_SUMMARY':
    case 'SELECT_MISSING_WORD':
      if (!audioKey) {
        return {
          isValid: false,
          message: 'Audio file is required for this question type.',
        };
      }
      if (!options || !Array.isArray(options)) {
        return {
          isValid: false,
          message: 'Options are required for this question type.',
        };
      }
      break;

    default:
      return { isValid: false, message: 'Unknown question type.' };
  }

  return { isValid: true, message: 'Valid' };
}
