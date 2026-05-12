import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { CustomRequest } from '../../types';

/**
 * @desc    Bulk update prediction level for multiple questions
 * @route   PUT /api/admin/questions/prediction-level
 * @access  Private/Admin
 */
export const updatePredictionLevel = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { questionIds, predictionLevel } = req.body;

    try {
      // Validate inputs
      if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Please provide an array of question IDs.',
        );
      }

      const validLevels = ['NONE', 'LOW', 'MEDIUM', 'HIGH'];
      if (!predictionLevel || !validLevels.includes(predictionLevel)) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          `Invalid prediction level. Must be one of: ${validLevels.join(', ')}`,
        );
      }

      // Validate all IDs are valid ObjectId format
      const invalidIds = questionIds.filter((id: string) => !id || id.length !== 24);
      if (invalidIds.length > 0) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'One or more question IDs have an invalid format.',
        );
      }

      // Bulk update prediction level
      const result = await prisma.question.updateMany({
        where: {
          id: { in: questionIds },
          isArchived: false,
        },
        data: {
          predictionLevel: predictionLevel as any,
          updatedAt: new Date(),
        },
      });

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          updatedCount: result.count,
          predictionLevel,
        },
        `Successfully updated prediction level to ${predictionLevel} for ${result.count} question(s).`,
      );
    } catch (error: any) {
      console.error('Update prediction level error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while updating prediction levels. Please try again.',
      );
    }
  },
);
