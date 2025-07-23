import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { SecureUrlService } from '../../services/secureUrlService';

interface GenerateSecureVideoUrlRequest extends Request {
  body: {
    videoUrl: string;
    expirationHours?: number;
  };
}

/**
 * @desc Generate secure signed URL for course video
 * @route POST /api/admin/secure-url/video
 * @access Private/Admin
 */
export const generateSecureVideoUrl = asyncHandler(
  async (req: GenerateSecureVideoUrlRequest, res: Response) => {
    const { videoUrl, expirationHours } = req.body;

    // Validate required fields
    if (!videoUrl) {
      res.status(400);
      throw new Error('Video URL is required');
    }

    // Validate expiration hours if provided
    if (expirationHours !== undefined) {
      if (typeof expirationHours !== 'number' || expirationHours <= 0 || expirationHours > 168) {
        res.status(400);
        throw new Error('Expiration hours must be a positive number between 1 and 168 (7 days)');
      }
    }

    try {
      // Generate secure signed URL
      const secureUrlResponse = await SecureUrlService.generateSecureVideoUrl(
        videoUrl,
        { expirationHours }
      );

      res.status(200).json({
        success: true,
        message: 'Secure video URL generated successfully',
        data: {
          originalUrl: videoUrl,
          secureUrl: secureUrlResponse.signedUrl,
          expiresAt: secureUrlResponse.expiresAt,
          expirationHours: secureUrlResponse.expirationHours,
        },
      });
    } catch (error) {
      console.error('Error generating secure video URL:', error);
      res.status(500);
      throw new Error('Failed to generate secure video URL');
    }
  }
);

interface GenerateSecureVideoUrlsRequest extends Request {
  body: {
    videoUrls: string[];
    expirationHours?: number;
  };
}

/**
 * @desc Generate secure signed URLs for multiple course videos
 * @route POST /api/admin/secure-url/videos
 * @access Private/Admin
 */
export const generateSecureVideoUrls = asyncHandler(
  async (req: GenerateSecureVideoUrlsRequest, res: Response) => {
    const { videoUrls, expirationHours } = req.body;

    // Validate required fields
    if (!videoUrls || !Array.isArray(videoUrls) || videoUrls.length === 0) {
      res.status(400);
      throw new Error('Video URLs array is required and must not be empty');
    }

    // Validate each URL
    for (const url of videoUrls) {
      if (typeof url !== 'string' || !url.trim()) {
        res.status(400);
        throw new Error('All video URLs must be valid strings');
      }
    }

    // Validate expiration hours if provided
    if (expirationHours !== undefined) {
      if (typeof expirationHours !== 'number' || expirationHours <= 0 || expirationHours > 168) {
        res.status(400);
        throw new Error('Expiration hours must be a positive number between 1 and 168 (7 days)');
      }
    }

    try {
      // Generate secure signed URLs
      const secureUrlResponses = await SecureUrlService.generateSecureVideoUrls(
        videoUrls,
        { expirationHours }
      );

      const responseData = videoUrls.map((originalUrl, index) => ({
        originalUrl,
        secureUrl: secureUrlResponses[index].signedUrl,
        expiresAt: secureUrlResponses[index].expiresAt,
        expirationHours: secureUrlResponses[index].expirationHours,
      }));

      res.status(200).json({
        success: true,
        message: 'Secure video URLs generated successfully',
        data: responseData,
      });
    } catch (error) {
      console.error('Error generating secure video URLs:', error);
      res.status(500);
      throw new Error('Failed to generate secure video URLs');
    }
  }
);
