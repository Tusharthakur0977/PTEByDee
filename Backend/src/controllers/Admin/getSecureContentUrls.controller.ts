import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { SecureUrlService } from '../../services/secureUrlService';

interface GetSecureContentUrlsRequest extends Request {
  body: {
    imageKeys?: string[];
    videoKeys?: string[];
    expirationHours?: number;
  };
}

/**
 * @desc Get secure URLs for course content (images and videos)
 * @route POST /api/admin/content/secure-urls
 * @access Private/Admin
 */
export const getSecureContentUrls = asyncHandler(
  async (req: GetSecureContentUrlsRequest, res: Response) => {
    const { imageKeys = [], videoKeys = [], expirationHours = 24 } = req.body;

    // Validate input
    if (
      (!imageKeys || imageKeys.length === 0) &&
      (!videoKeys || videoKeys.length === 0)
    ) {
      res.status(400);
      throw new Error('At least one image key or video key is required');
    }

    // Validate expiration hours
    if (
      typeof expirationHours !== 'number' ||
      expirationHours <= 0 ||
      expirationHours > 168
    ) {
      res.status(400);
      throw new Error(
        'Expiration hours must be a positive number between 1 and 168 (7 days)'
      );
    }

    try {
      const results: any = {
        images: {},
        videos: {},
        expirationHours,
        generatedAt: new Date().toISOString(),
      };

      // Generate signed URLs for images
      if (imageKeys && imageKeys.length > 0) {
        const imagePromises = imageKeys.map(async (key) => {
          try {
            const result = await SecureUrlService.generateSecureImageUrl(key, {
              expirationHours,
            });
            return { key, ...result };
          } catch (error) {
            console.error(
              `Failed to generate URL for image key: ${key}`,
              error
            );
            return { key, error: 'Failed to generate signed URL' };
          }
        });

        const imageResults = await Promise.all(imagePromises);
        imageResults.forEach((result) => {
          if ('error' in result) {
            results.images[result.key] = { error: result.error };
          } else {
            results.images[result.key] = {
              signedUrl: result.signedUrl,
              expiresAt: result.expiresAt,
            };
          }
        });
      }

      // Generate signed URLs for videos
      if (videoKeys && videoKeys.length > 0) {
        const videoPromises = videoKeys.map(async (key) => {
          try {
            const result = await SecureUrlService.generateSecureVideoUrl(key, {
              expirationHours,
            });
            return { key, ...result };
          } catch (error) {
            console.error(
              `Failed to generate URL for video key: ${key}`,
              error
            );
            return { key, error: 'Failed to generate signed URL' };
          }
        });

        const videoResults = await Promise.all(videoPromises);
        videoResults.forEach((result) => {
          if ('error' in result) {
            results.videos[result.key] = { error: result.error };
          } else {
            results.videos[result.key] = {
              signedUrl: result.signedUrl,
              expiresAt: result.expiresAt,
            };
          }
        });
      }

      res.status(200).json({
        success: true,
        message: 'Secure URLs generated successfully',
        data: results,
      });
    } catch (error) {
      console.error('Error generating secure content URLs:', error);
      res.status(500);
      throw new Error('Failed to generate secure URLs');
    }
  }
);

interface GetCourseContentUrlsRequest extends Request {
  params: {
    courseId: string;
  };
  body: {
    expirationHours?: number;
  };
}

/**
 * @desc Get secure URLs for all content in a specific course
 * @route POST /api/admin/courses/:courseId/secure-urls
 * @access Private/Admin
 */
export const getCourseContentUrls = asyncHandler(
  async (req: GetCourseContentUrlsRequest, res: Response) => {
    const { courseId } = req.params;
    const { expirationHours = 24 } = req.body;

    if (!courseId) {
      res.status(400);
      throw new Error('Course ID is required');
    }

    try {
      // You would typically fetch course data from your database here
      // For now, this is a placeholder that you can customize based on your data model

      // Example: Fetch course from database
      // const course = await prisma.course.findUnique({
      //   where: { id: courseId },
      //   select: { imageKey: true, videoKey: true, /* other fields */ }
      // });

      // if (!course) {
      //   res.status(404);
      //   throw new Error('Course not found');
      // }

      // For now, return a structure that you can customize
      res.status(200).json({
        success: true,
        message:
          'This endpoint needs to be customized based on your course data model',
        data: {
          courseId,
          expirationHours,
          note: 'Please implement course data fetching based on your database schema',
          exampleUsage: {
            imageKeys: ['course-images/example.jpg'],
            videoKeys: ['course-videos/example.mp4'],
          },
        },
      });
    } catch (error) {
      console.error('Error getting course content URLs:', error);
      res.status(500);
      throw new Error('Failed to get course content URLs');
    }
  }
);
