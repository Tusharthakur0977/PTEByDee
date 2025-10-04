import { PteQuestionTypeName } from '@prisma/client';
import prisma from '../config/prismaInstance';

/**
 * Generate question type abbreviation from PteQuestionTypeName
 * This creates short, recognizable codes for each question type
 */
export function getQuestionTypeAbbreviation(
  questionType: PteQuestionTypeName
): string {
  const abbreviations: Record<PteQuestionTypeName, string> = {
    // Speaking Section
    READ_ALOUD: 'RA',
    REPEAT_SENTENCE: 'RS',
    DESCRIBE_IMAGE: 'DI',
    RE_TELL_LECTURE: 'RTL',
    ANSWER_SHORT_QUESTION: 'ASQ',

    // Writing Section
    SUMMARIZE_WRITTEN_TEXT: 'SWT',
    WRITE_ESSAY: 'WE',

    // Reading Section
    FILL_IN_THE_BLANKS_DRAG_AND_DROP: 'RWFIB',
    MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING: 'MCMAR',
    RE_ORDER_PARAGRAPHS: 'ROP',
    READING_FILL_IN_THE_BLANKS: 'RFIB',
    MULTIPLE_CHOICE_SINGLE_ANSWER_READING: 'MCSAR',

    // Listening Section
    SUMMARIZE_SPOKEN_TEXT: 'SST',
    MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING: 'MCMAL',
    LISTENING_FILL_IN_THE_BLANKS: 'FIBL',
    HIGHLIGHT_CORRECT_SUMMARY: 'HCS',
    MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING: 'MCSAL',
    SELECT_MISSING_WORD: 'SMW',
    HIGHLIGHT_INCORRECT_WORDS: 'HIW',
    WRITE_FROM_DICTATION: 'WFD',
  };

  return abbreviations[questionType] || 'Q';
}

/**
 * Generate automatic question code based on question type
 * Format: {ABBREVIATION}_{NUMBER}
 * Example: RA_001, RS_002, DI_003, etc.
 *
 * @param questionTypeId - The ObjectId of the question type
 * @returns Promise<string> - The generated question code
 */
export async function generateQuestionCode(
  questionTypeId: string
): Promise<string> {
  // Get the question type to determine abbreviation
  const questionType = await prisma.questionType.findUnique({
    where: { id: questionTypeId },
  });

  if (!questionType) {
    throw new Error('Question type not found');
  }

  const abbreviation = getQuestionTypeAbbreviation(questionType.name);

  // Find the highest existing number for this question type
  const existingQuestions = await prisma.question.findMany({
    where: {
      questionTypeId: questionTypeId,
    },
    select: {
      questionCode: true,
    },
    orderBy: {
      questionCode: 'desc',
    },
  });

  // Extract numbers from existing question codes for this type
  const existingNumbers = existingQuestions
    .map((q) => {
      const match = q.questionCode.match(
        new RegExp(`^${abbreviation}_(\\d+)$`)
      );
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((num) => num > 0);

  // Get the next number (highest + 1, or 1 if no existing questions)
  const nextNumber =
    existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;

  // Format with leading zeros (3 digits)
  const formattedNumber = nextNumber.toString().padStart(3, '0');

  return `${abbreviation}_${formattedNumber}`;
}

/**
 * Validate if a question code follows the expected format
 * @param questionCode - The question code to validate
 * @returns boolean - True if valid format
 */
export function isValidQuestionCodeFormat(questionCode: string): boolean {
  // Pattern: ABBREVIATION_NUMBER (e.g., RA_001, RWFIB_123)
  const pattern = /^[A-Z]+_\d{3}$/;
  return pattern.test(questionCode);
}

/**
 * Extract question type abbreviation from question code
 * @param questionCode - The question code (e.g., "RA_001")
 * @returns string - The abbreviation part (e.g., "RA")
 */
export function extractAbbreviationFromCode(questionCode: string): string {
  const match = questionCode.match(/^([A-Z]+)_\d+$/);
  return match ? match[1] : '';
}

/**
 * Extract number from question code
 * @param questionCode - The question code (e.g., "RA_001")
 * @returns number - The number part (e.g., 1)
 */
export function extractNumberFromCode(questionCode: string): number {
  const match = questionCode.match(/^[A-Z]+_(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}
