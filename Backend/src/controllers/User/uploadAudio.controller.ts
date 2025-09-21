import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { checkS3Configuration } from '../../config/s3Config';
import { CustomRequest } from '../../types';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';

/**
 * @desc    Upload audio file to S3
 * @route   POST /api/user/upload-audio
 * @access  Private (requires authentication)
 */
export const uploadAudio = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?.id;

    try {
      // Check if S3 is properly configured
      if (!checkS3Configuration()) {
        return sendResponse(
          res,
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          null,
          'Audio upload service is not properly configured. Please contact support.'
        );
      }

      if (!userId) {
        return sendResponse(
          res,
          STATUS_CODES.UNAUTHORIZED,
          null,
          'Authentication required.'
        );
      }

      // Get the uploaded file information
      const uploadedFile = req.file as Express.MulterS3.File;

      console.log('Audio file uploaded successfully:', {
        key: uploadedFile.key,
        size: uploadedFile.size,
        mimeType: uploadedFile.mimetype,
        userId,
      });

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          audioKey: uploadedFile.key,
          fileName: uploadedFile.originalname,
          size: uploadedFile.size,
          mimeType: uploadedFile.mimetype,
          uploadedAt: new Date().toISOString(),
          location: uploadedFile.location,
        },
        'Audio file uploaded successfully.'
      );
    } catch (error: any) {
      console.error('Unexpected audio upload error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An unexpected error occurred while uploading the audio file.'
      );
    }
  }
);

export default uploadAudio;
