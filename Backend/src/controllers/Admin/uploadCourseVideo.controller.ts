import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { checkS3Configuration } from '../../config/s3Config';
import { SecureUrlService } from '../../services/secureUrlService';

/**
 * @desc    Upload course video to S3
 * @route   POST /api/admin/upload/course-video
 * @access  Private/Admin
 */
export const uploadCourseVideo = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Check if S3 is properly configured
      if (!checkS3Configuration()) {
        return sendResponse(
          res,
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          null,
          'AWS S3 is not properly configured. Please check environment variables.'
        );
      }

      // Check if file was uploaded
      if (!req.file) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'No video file provided. Please select a video to upload.'
        );
      }

      // Get the uploaded file information
      const uploadedFile = req.file as Express.MulterS3.File;

      // Validate file upload
      if (!uploadedFile.location) {
        return sendResponse(
          res,
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          null,
          'Failed to upload video. Please try again.'
        );
      }

      // Generate signed URL for immediate preview (24 hours)
      let previewUrl = null;
      try {
        if (SecureUrlService.isConfigured()) {
          const signedUrlResponse =
            await SecureUrlService.generateSecureVideoUrl(uploadedFile.key, {
              expirationHours: 24,
            });
          previewUrl = signedUrlResponse.signedUrl;
        }
      } catch (error) {
        console.warn('Failed to generate preview URL:', error);
        // Continue without preview URL
      }

      // Return success response with S3 key and optional preview URL
      return sendResponse(
        res,
        STATUS_CODES.CREATED,
        {
          videoKey: uploadedFile.key, // Store this in your database
          videoUrl: previewUrl, // Use this for immediate preview (optional)
          fileName: uploadedFile.key,
          fileSize: uploadedFile.size,
          mimeType: uploadedFile.mimetype,
          duration: null, // Could be extracted using ffmpeg in the future
          // Legacy field for backward compatibility
          location: uploadedFile.location,
        },
        'Video uploaded successfully.'
      );
    } catch (error: any) {
      console.error('Upload course video error:', error);

      // Handle specific multer errors
      if (error.code === 'LIMIT_FILE_SIZE') {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'File size too large. Maximum size allowed is 100MB.'
        );
      }

      if (error.message && error.message.includes('Invalid file type')) {
        return sendResponse(res, STATUS_CODES.BAD_REQUEST, null, error.message);
      }

      // Handle AWS S3 errors
      if (error.code === 'NoSuchBucket') {
        return sendResponse(
          res,
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          null,
          'S3 bucket not found. Please check AWS configuration.'
        );
      }

      if (error.code === 'AccessDenied') {
        return sendResponse(
          res,
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          null,
          'Access denied to S3 bucket. Please check AWS credentials.'
        );
      }

      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while uploading the video. Please try again.'
      );
    }
  }
);
