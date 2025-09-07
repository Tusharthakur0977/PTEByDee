import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import {
  generateQuestionCode,
  getQuestionTypeAbbreviation,
} from '../../utils/questionCodeGenerator';

/**
 * @desc    Get the next question code for a specific question type
 * @route   GET /api/admin/questions/next-code/:questionTypeId
 * @access  Private/Admin
 */
export const getNextQuestionCode = asyncHandler(
  async (req: Request, res: Response) => {
    const { questionTypeId } = req.params;

    try {
      // Validate ObjectId format
      if (!questionTypeId || questionTypeId.length !== 24) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Invalid question type ID'
        );
      }

      // Generate the next question code
      const nextQuestionCode = await generateQuestionCode(questionTypeId);

      // Get question type details for response
      const questionType = await prisma.questionType.findUnique({
        where: { id: questionTypeId },
      });

      if (!questionType) {
        return sendResponse(
          res,
          STATUS_CODES.NOT_FOUND,
          null,
          'Question type not found'
        );
      }

      const abbreviation = getQuestionTypeAbbreviation(questionType.name);
      const numberMatch = nextQuestionCode.match(/_(\d+)$/);
      const nextNumber = numberMatch ? parseInt(numberMatch[1], 10) : 1;

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          nextQuestionCode,
          questionType: questionType.name,
          abbreviation,
          nextNumber,
        },
        'Next question code generated successfully.'
      );
    } catch (error: any) {
      console.error('Get next question code error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while generating the next question code.'
      );
    }
  }
);
