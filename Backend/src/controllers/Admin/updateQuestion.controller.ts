import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { CustomRequest } from '../../types';

/**
 * @desc    Update a PTE question
 * @route   PUT /api/admin/questions/:id
 * @access  Private/Admin
 */
export const updateQuestion = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { id } = req.params;
    const {
      questionCode,
      questionTypeId,
      testId,
      orderInTest,
      textContent,
      questionStatement,
      audioKey,
      imageKey,
      options,
      correctAnswers,
      wordCountMin,
      wordCountMax,
      durationMillis,
      originalTextWithErrors,
      incorrectWords,
      blanks,
      paragraphs,
    } = req.body;

    console.log('SSSSSSSS');

    try {
      // Validate ObjectId format
      if (!id || id.length !== 24) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Invalid question ID format.'
        );
      }

      // Check if question exists
      const existingQuestion = await prisma.question.findUnique({
        where: { id },
        include: {
          questionType: true,
        },
      });

      if (!existingQuestion) {
        return sendResponse(
          res,
          STATUS_CODES.NOT_FOUND,
          null,
          'Question not found.'
        );
      }

      // Check if question code is being changed and if it conflicts
      if (questionCode && questionCode !== existingQuestion.questionCode) {
        const codeExists = await prisma.question.findFirst({
          where: {
            questionCode,
            id: { not: id },
          },
        });

        if (codeExists) {
          return sendResponse(
            res,
            STATUS_CODES.CONFLICT,
            null,
            'Question code already exists. Please use a unique code.'
          );
        }
      }

      console.log('WWWWWWWWWWWWWWWWWW');

      // Prepare update data
      const updateData: any = {};

      if (questionCode) updateData.questionCode = questionCode;
      if (questionTypeId) updateData.questionTypeId = questionTypeId;
      if (testId) updateData.testId = testId;
      if (orderInTest !== undefined) updateData.orderInTest = orderInTest;
      if (textContent !== undefined)
        updateData.textContent = textContent || null;
      if (questionStatement !== undefined)
        updateData.questionStatement = questionStatement || null;
      if (audioKey !== undefined) updateData.audioUrl = audioKey || null;
      if (imageKey !== undefined) updateData.imageUrl = imageKey || null;

      // Handle blanks data for fill-in-the-blanks questions
      if (blanks !== undefined && Array.isArray(blanks)) {
        // Transform blanks array into the format expected by the database
        const processedBlanks = blanks.map((blank: any, index: number) => ({
          id: blank.id || `blank_${index + 1}`,
          position: blank.position || index + 1,
          correctAnswer: blank.correctAnswer,
          options: blank.options || [],
        }));
        updateData.options = processedBlanks;

        // Update correct answers from blanks
        const processedCorrectAnswers = blanks.reduce(
          (acc: any, blank: any, index: number) => {
            acc[`blank${index + 1}`] = blank.correctAnswer;
            return acc;
          },
          {}
        );
        updateData.correctAnswers = processedCorrectAnswers;
      } else if (paragraphs !== undefined && Array.isArray(paragraphs)) {
        // Handle paragraphs data for re-order paragraphs questions
        const processedParagraphs = paragraphs.map((paragraph: any) => ({
          id: paragraph.id || `para_${Date.now()}_${Math.random()}`,
          text: paragraph.text,
          correctOrder: paragraph.correctOrder,
        }));
        updateData.options = processedParagraphs;

        // Store correct order in correctAnswers field
        const correctOrder = paragraphs
          .sort((a: any, b: any) => a.correctOrder - b.correctOrder)
          .map((p: any) => p.id || `para_${Date.now()}_${Math.random()}`);

        updateData.correctAnswers = { correctOrder };
      } else if (options !== undefined) {
        updateData.options = options || null;
      }

      if (correctAnswers !== undefined)
        updateData.correctAnswers = correctAnswers || null;
      if (wordCountMin !== undefined)
        updateData.wordCountMin = wordCountMin || null;
      if (wordCountMax !== undefined)
        updateData.wordCountMax = wordCountMax || null;
      if (durationMillis !== undefined)
        updateData.durationMillis = durationMillis || null;
      if (originalTextWithErrors !== undefined)
        updateData.originalTextWithErrors = originalTextWithErrors || null;
      if (incorrectWords !== undefined)
        updateData.incorrectWords = incorrectWords || null;

      updateData.updatedAt = new Date();

      console.log(updateData, 'QWXZZS');

      // Update the question
      const updatedQuestion = await prisma.question.update({
        where: { id },
        data: updateData,
        include: {
          questionType: {
            include: {
              pteSection: true,
            },
          },
          _count: {
            select: {
              UserResponse: true,
            },
          },
        },
      });

      return sendResponse(
        res,
        STATUS_CODES.OK,
        updatedQuestion,
        'Question updated successfully.'
      );
    } catch (error: any) {
      console.error('Update question error:', error);

      if (error.code === 'P2025') {
        return sendResponse(
          res,
          STATUS_CODES.NOT_FOUND,
          null,
          'Question not found.'
        );
      }

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
        'An error occurred while updating the question. Please try again.'
      );
    }
  }
);
