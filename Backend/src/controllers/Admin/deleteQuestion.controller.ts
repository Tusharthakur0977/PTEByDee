import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { deleteFileFromS3 } from '../../config/s3Config';

/**
 * @desc    Delete a PTE question
 * @route   DELETE /api/admin/questions/:id
 * @access  Private/Admin
 */
export const deleteQuestion = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

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
      const question = await prisma.question.findUnique({
        where: { id },
        include: {
          UserResponse: true,
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

      // Check if question has user responses
      if (question.UserResponse.length > 0) {
        return sendResponse(
          res,
          STATUS_CODES.CONFLICT,
          null,
          `Cannot delete question with ${question.UserResponse.length} user responses. Please archive instead.`
        );
      }

      // Delete associated files from S3 if they exist
      const filesToDelete = [];
      if (question.audioUrl) {
        filesToDelete.push({ type: 'audio', key: question.audioUrl });
      }
      if (question.imageUrl) {
        filesToDelete.push({ type: 'image', url: question.imageUrl });
      }

      // Delete the question
      await prisma.question.delete({
        where: { id },
      });

      // Clean up S3 files (async, don't wait)
      if (filesToDelete.length > 0) {
        Promise.all(
          filesToDelete.map(async (file) => {
            try {
              if (file.type === 'audio') {
                // For audio files, we have the S3 key
                const bucketName = process.env.AWS_S3_BUCKET_NAME;
                if (bucketName && file.key) {
                  await deleteFileFromS3(
                    `https://${bucketName}.s3.amazonaws.com/${file.key}`
                  );
                }
              } else if (file.type === 'image' && file.url) {
                // For images, we might have full URL
                await deleteFileFromS3(file.url);
              }
            } catch (error) {
              console.warn(`Failed to delete ${file.type} file:`, error);
            }
          })
        ).catch((error) => {
          console.warn('Some files could not be deleted from S3:', error);
        });
      }

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          questionId: id,
          questionCode: question.questionCode,
          deletedFiles: filesToDelete.length,
        },
        `Question "${question.questionCode}" deleted successfully.`
      );
    } catch (error: any) {
      console.error('Delete question error:', error);

      if (error.code === 'P2025') {
        return sendResponse(
          res,
          STATUS_CODES.NOT_FOUND,
          null,
          'Question not found.'
        );
      }

      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while deleting the question. Please try again.'
      );
    }
  }
);
