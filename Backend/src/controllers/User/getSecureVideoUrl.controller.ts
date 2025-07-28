import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { CustomRequest } from '../../types';
import { SecureUrlService } from '../../services/secureUrlService';

/**
 * @desc    Get secure video URL for enrolled users
 * @route   POST /api/user/secure-video-url
 * @access  Private (requires authentication)
 */
export const getSecureVideoUrl = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?.id;
    const { videoKey, courseId } = req.body;

    try {
      console.log('getSecureVideoUrl - Request:', {
        userId,
        videoKey,
        courseId,
      });

      if (!userId) {
        console.log('getSecureVideoUrl - No user ID');
        return sendResponse(
          res,
          STATUS_CODES.UNAUTHORIZED,
          null,
          'Authentication required to access video content.'
        );
      }

      if (!videoKey || !courseId) {
        console.log('getSecureVideoUrl - Missing videoKey or courseId');
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Video key and course ID are required.'
        );
      }

      // Verify user is enrolled in the course
      console.log('getSecureVideoUrl - Checking enrollment for:', {
        userId,
        courseId,
      });
      const enrollment = await prisma.userCourse.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
      });

      console.log('getSecureVideoUrl - Enrollment found:', !!enrollment);

      if (!enrollment) {
        console.log('getSecureVideoUrl - User not enrolled');
        return sendResponse(
          res,
          STATUS_CODES.FORBIDDEN,
          null,
          'You must be enrolled in this course to access video content.'
        );
      }

      // Generate secure video URL (24 hours expiration)
      console.log(
        'getSecureVideoUrl - Generating secure URL for videoKey:',
        videoKey
      );
      const secureUrlResponse = await SecureUrlService.generateSecureVideoUrl(
        videoKey,
        { expirationHours: 24 }
      );

      console.log('getSecureVideoUrl - Secure URL generated:', {
        videoKey,
        hasSignedUrl: !!secureUrlResponse.signedUrl,
        expiresAt: secureUrlResponse.expiresAt,
      });

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          videoKey,
          secureUrl: secureUrlResponse.signedUrl,
          expiresAt: secureUrlResponse.expiresAt,
          expirationHours: secureUrlResponse.expirationHours,
        },
        'Secure video URL generated successfully.'
      );
    } catch (error: any) {
      console.error('Get secure video URL error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while generating secure video URL. Please try again.'
      );
    }
  }
);
