import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { CustomRequest } from '../../types';
import { PteQuestionTypeName } from '@prisma/client';

const countWords = (value?: string | null): number =>
  value
    ? value
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length
    : 0;

const extractStringValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    const firstString = value.find((item) => typeof item === 'string');
    return typeof firstString === 'string' ? firstString : '';
  }

  return '';
};

const countCorrectOptions = (options: unknown): number => {
  if (!Array.isArray(options)) {
    return 0;
  }

  const correctCount = options.filter(
    (option: any) => option?.isCorrect === true
  ).length;

  return correctCount;
};

const getCorrectOrderCount = (correctAnswers: unknown): number => {
  if (
    correctAnswers &&
    typeof correctAnswers === 'object' &&
    Array.isArray((correctAnswers as Record<string, unknown>).correctOrder)
  ) {
    return (
      (correctAnswers as Record<string, unknown>).correctOrder as unknown[]
    ).length;
  }

  if (Array.isArray(correctAnswers)) {
    return correctAnswers.length;
  }

  return 0;
};

const countBlankAnswers = (options: unknown, correctAnswers: unknown): number => {
  if (Array.isArray(options) && options.length > 0) {
    const blankOptionCount = options.filter(
      (option: any) =>
        option &&
        typeof option === 'object' &&
        'correctAnswer' in option
    ).length;

    if (blankOptionCount > 0) {
      return blankOptionCount;
    }
  }

  if (Array.isArray(correctAnswers)) {
    return correctAnswers.length > 0 ? correctAnswers.length : 1;
  }

  if (correctAnswers && typeof correctAnswers === 'object') {
    const correctOrderCount = getCorrectOrderCount(correctAnswers);
    if (correctOrderCount > 0) {
      return correctOrderCount;
    }

    const count = Object.keys(correctAnswers as Record<string, unknown>).length;
    return count > 0 ? count : 1;
  }

  return 1;
};

const getPracticeResponseMaxMarks = (question: {
  questionType: { name: PteQuestionTypeName };
  options?: unknown;
  correctAnswers?: unknown;
  incorrectWords?: unknown;
  textContent?: string | null;
}): number => {
  switch (question.questionType.name) {
    case PteQuestionTypeName.READ_ALOUD:
    case PteQuestionTypeName.REPEAT_SENTENCE:
      return 13;

    case PteQuestionTypeName.DESCRIBE_IMAGE:
    case PteQuestionTypeName.RE_TELL_LECTURE:
    case PteQuestionTypeName.SUMMARIZE_GROUP_DISCUSSION:
    case PteQuestionTypeName.RESPOND_TO_A_SITUATION:
      return 16;

    case PteQuestionTypeName.SUMMARIZE_WRITTEN_TEXT:
    case PteQuestionTypeName.SUMMARIZE_SPOKEN_TEXT:
      return 9;

    case PteQuestionTypeName.WRITE_ESSAY:
      return 26;

    case PteQuestionTypeName.ANSWER_SHORT_QUESTION:
    case PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_READING:
    case PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING:
    case PteQuestionTypeName.HIGHLIGHT_CORRECT_SUMMARY:
    case PteQuestionTypeName.SELECT_MISSING_WORD:
      return 1;

    case PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING:
    case PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING:
      return Math.max(1, countCorrectOptions(question.options), countBlankAnswers(undefined, question.correctAnswers));

    case PteQuestionTypeName.RE_ORDER_PARAGRAPHS: {
      const orderedItems = Array.isArray(question.options)
        ? question.options.length
        : getCorrectOrderCount(question.correctAnswers);
      return Math.max(1, orderedItems - 1);
    }

    case PteQuestionTypeName.READING_FILL_IN_THE_BLANKS:
    case PteQuestionTypeName.FILL_IN_THE_BLANKS_DRAG_AND_DROP:
    case PteQuestionTypeName.LISTENING_FILL_IN_THE_BLANKS:
      return Math.max(1, countBlankAnswers(question.options, question.correctAnswers));

    case PteQuestionTypeName.HIGHLIGHT_INCORRECT_WORDS:
      return Array.isArray(question.incorrectWords) &&
        question.incorrectWords.length > 0
        ? question.incorrectWords.length
        : 1;

    case PteQuestionTypeName.WRITE_FROM_DICTATION: {
      const dictationSource =
        extractStringValue(question.correctAnswers) ||
        String(question.textContent || '');
      return Math.max(1, countWords(dictationSource));
    }

    default:
      return 1;
  }
};

const getPracticeResponseMarks = (score: number, totalMarks: number) => {
  const safeTotalMarks = Math.max(1, totalMarks);
  const safeScore = Number.isFinite(score) ? score : 0;

  let marksObtained = safeScore;

  if (safeScore <= 1 && safeTotalMarks > 1) {
    marksObtained = safeScore * safeTotalMarks;
  } else if (safeScore > safeTotalMarks && safeScore <= 100 && safeTotalMarks > 1) {
    marksObtained = (safeScore / 100) * safeTotalMarks;
  }

  return {
    marksObtained: Math.max(
      0,
      Math.min(safeTotalMarks, Math.round(marksObtained))
    ),
    totalMarks: safeTotalMarks,
  };
};

/**
 * @desc    Get user's practice history
 * @route   GET /api/user/practice/history
 * @access  Private (requires authentication)
 */
export const getPracticeHistory = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?.id;
    const {
      page = '1',
      limit = '20',
      search,
      questionType,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    try {
      if (!userId) {
        return sendResponse(
          res,
          STATUS_CODES.UNAUTHORIZED,
          null,
          'Authentication required to view practice history.'
        );
      }

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);
      const skip = (pageNumber - 1) * limitNumber;

      // Build where clause
      const whereClause: any = { userId };

      if (questionType) {
        whereClause.questionType = questionType;
      }

      if (search) {
        whereClause.OR = [
          {
            question: {
              is: {
                questionCode: {
                  contains: search as string,
                  mode: 'insensitive',
                },
              },
            },
          },
          {
            question: {
              is: {
                questionStatement: {
                  contains: search as string,
                  mode: 'insensitive',
                },
              },
            },
          },
          {
            question: {
              is: {
                textContent: {
                  contains: search as string,
                  mode: 'insensitive',
                },
              },
            },
          },
        ];
      }

      if (dateFrom || dateTo) {
        whereClause.createdAt = {};
        if (dateFrom) {
          whereClause.createdAt.gte = new Date(dateFrom as string);
        }
        if (dateTo) {
          whereClause.createdAt.lte = new Date(dateTo as string);
        }
      }

      // Get total count
      const totalResponses = await prisma.practiceResponse.count({
        where: whereClause,
      });

      // Get practice responses with question details
      const practiceResponses = await prisma.practiceResponse.findMany({
        where: whereClause,
        include: {
          question: {
            select: {
              id: true,
              questionCode: true,
              questionStatement: true,
              textContent: true,
              imageUrl: true,
              audioUrl: true,
              difficultyLevel: true,
              options: true,
              correctAnswers: true,
              incorrectWords: true,
              questionType: {
                select: {
                  name: true,
                  pteSection: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          [sortBy as string]: sortOrder as 'asc' | 'desc',
        },
        skip,
        take: limitNumber,
      });

      // Calculate pagination
      const totalPages = Math.ceil(totalResponses / limitNumber);
      const hasNextPage = pageNumber < totalPages;
      const hasPrevPage = pageNumber > 1;

      // Transform responses for frontend
      const transformedResponses = practiceResponses.map((response) => {
        const promptSource =
          response.question.questionStatement || response.question.textContent;
        const promptPreview = promptSource
          ? promptSource.length > 140
            ? `${promptSource.substring(0, 140)}...`
            : promptSource
          : 'No preview available';

        return {
          id: response.id,
          questionId: response.questionId,
          questionCode: response.question.questionCode,
          questionType: response.questionType,
          questionTypeLabel: response.question.questionType.name
            .split('_')
            .map(
              (word: string) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(' '),
          sectionName: response.question.questionType.pteSection.name,
          difficultyLevel: response.question.difficultyLevel,
          promptPreview,
          hasAudio: !!response.question.audioUrl,
          hasImage: !!response.question.imageUrl,
          isCorrect: response.isCorrect,
          score: response.score,
          ...getPracticeResponseMarks(
            response.score,
            getPracticeResponseMaxMarks(response.question)
          ),
          timeTakenSeconds: response.timeTakenSeconds,
          createdAt: response.createdAt,
        };
      });

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          responses: transformedResponses,
          pagination: {
            currentPage: pageNumber,
            totalPages,
            totalResponses,
            hasNextPage,
            hasPrevPage,
            limit: limitNumber,
          },
          filters: {
            search: search as string,
            questionType: questionType as string,
            dateFrom: dateFrom as string,
            dateTo: dateTo as string,
            sortBy: sortBy as string,
            sortOrder: sortOrder as string,
          },
        },
        'Practice history retrieved successfully.'
      );
    } catch (error: any) {
      console.error('Get practice history error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while fetching practice history. Please try again.'
      );
    }
  }
);
