import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { SecureUrlService } from '../../services/secureUrlService';

interface GenerateSecureImageUrlRequest extends Request {
  body: {
    imageUrl: string;
    expirationHours?: number;
  };
}

/**
 * @desc Generate secure signed URL for course image
 * @route POST /api/admin/secure-url/image
 * @access Private/Admin
 */
export const generateSecureImageUrl = asyncHandler(
  async (req: GenerateSecureImageUrlRequest, res: Response) => {
    const { imageUrl, expirationHours } = req.body;

    // Validate required fields
    if (!imageUrl) {
      res.status(400);
      throw new Error('Image URL is required');
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
      const secureUrlResponse = await SecureUrlService.generateSecureImageUrl(
        imageUrl,
        { expirationHours }
      );

      res.status(200).json({
        success: true,
        message: 'Secure image URL generated successfully',
        data: {
          originalUrl: imageUrl,
          secureUrl: secureUrlResponse.signedUrl,
          expiresAt: secureUrlResponse.expiresAt,
          expirationHours: secureUrlResponse.expirationHours,
        },
      });
    } catch (error) {
      console.error('Error generating secure image URL:', error);
      res.status(500);
      throw new Error('Failed to generate secure image URL');
    }
  }
);

interface GenerateSecureImageUrlsRequest extends Request {
  body: {
    imageUrls: string[];
    expirationHours?: number;
  };
}

/**
 * @desc Generate secure signed URLs for multiple course images
 * @route POST /api/admin/secure-url/images
 * @access Private/Admin
 */
export const generateSecureImageUrls = asyncHandler(
  async (req: GenerateSecureImageUrlsRequest, res: Response) => {
    const { imageUrls, expirationHours } = req.body;

    // Validate required fields
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      res.status(400);
      throw new Error('Image URLs array is required and must not be empty');
    }

    // Validate each URL
    for (const url of imageUrls) {
      if (typeof url !== 'string' || !url.trim()) {
        res.status(400);
        throw new Error('All image URLs must be valid strings');
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
      const secureUrlResponses = await SecureUrlService.generateSecureImageUrls(
        imageUrls,
        { expirationHours }
      );

      const responseData = imageUrls.map((originalUrl, index) => ({
        originalUrl,
        secureUrl: secureUrlResponses[index].signedUrl,
        expiresAt: secureUrlResponses[index].expiresAt,
        expirationHours: secureUrlResponses[index].expirationHours,
      }));

      res.status(200).json({
        success: true,
        message: 'Secure image URLs generated successfully',
        data: responseData,
      });
    } catch (error) {
      console.error('Error generating secure image URLs:', error);
      res.status(500);
      throw new Error('Failed to generate secure image URLs');
    }
  }
);
