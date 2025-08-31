import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';

/**
 * @desc    Get all question types with PTE sections for portal practice
 * @route   GET /api/user/question-types
 * @access  Public
 */
export const getQuestionTypes = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const questionTypes = await prisma.questionType.findMany({
        include: {
          pteSection: true,
          _count: {
            select: {
              questions: true,
            },
          },
        },
        orderBy: [{ pteSection: { name: 'asc' } }, { name: 'asc' }],
      });

      // Group by PTE section for better organization
      const groupedBySection = questionTypes.reduce((acc: any, qt) => {
        const sectionName = qt.pteSection.name;
        if (!acc[sectionName]) {
          acc[sectionName] = {
            section: qt.pteSection,
            questionTypes: [],
          };
        }
        acc[sectionName].questionTypes.push({
          id: qt.id,
          name: qt.name,
          description: qt.description,
          expectedTimePerQuestion: qt.expectedTimePerQuestion,
          questionCount: qt._count.questions,
        });
        return acc;
      }, {});

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          questionTypes,
          groupedBySection,
        },
        'Question types retrieved successfully.'
      );
    } catch (error: any) {
      console.error('Get question types error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while fetching question types. Please try again.'
      );
    }
  }
);
