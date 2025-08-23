import { SecureUrlService } from '../services/secureUrlService';

/**
 * Helper functions for generating signed URLs for media content
 */

export interface MediaItem {
  key: string;
  type: 'image' | 'video';
}

export interface SignedMediaItem {
  originalKey: string;
  signedUrl: string;
  expiresAt: string;
  type: 'image' | 'video';
}

/**
 * Generate signed URL for a single media item
 * @param key - S3 key of the media file
 * @param type - Type of media (image or video)
 * @param expirationHours - Hours until URL expires (default: 24)
 * @returns Signed URL or original key if generation fails
 */
export async function generateSignedUrlSafe(
  key: string,
  type: 'image' | 'video',
  expirationHours: number = 24
): Promise<string> {
  if (!key || !SecureUrlService.isConfigured()) {
    return key;
  }

  try {
    const signedUrlResponse = type === 'image' 
      ? await SecureUrlService.generateSecureImageUrl(key, { expirationHours })
      : await SecureUrlService.generateSecureVideoUrl(key, { expirationHours });
    
    return signedUrlResponse.signedUrl;
  } catch (error) {
    console.warn(`Failed to generate signed URL for ${type} ${key}:`, error);
    return key; // Return original key as fallback
  }
}

/**
 * Generate signed URLs for multiple media items
 * @param items - Array of media items with keys and types
 * @param expirationHours - Hours until URLs expire (default: 24)
 * @returns Array of signed media items
 */
export async function generateSignedUrlsBatch(
  items: MediaItem[],
  expirationHours: number = 24
): Promise<SignedMediaItem[]> {
  if (!SecureUrlService.isConfigured()) {
    return items.map(item => ({
      originalKey: item.key,
      signedUrl: item.key,
      expiresAt: new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString(),
      type: item.type,
    }));
  }

  const promises = items.map(async (item): Promise<SignedMediaItem> => {
    try {
      const signedUrlResponse = item.type === 'image'
        ? await SecureUrlService.generateSecureImageUrl(item.key, { expirationHours })
        : await SecureUrlService.generateSecureVideoUrl(item.key, { expirationHours });

      return {
        originalKey: item.key,
        signedUrl: signedUrlResponse.signedUrl,
        expiresAt: signedUrlResponse.expiresAt,
        type: item.type,
      };
    } catch (error) {
      console.warn(`Failed to generate signed URL for ${item.type} ${item.key}:`, error);
      return {
        originalKey: item.key,
        signedUrl: item.key, // Fallback to original key
        expiresAt: new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString(),
        type: item.type,
      };
    }
  });

  return Promise.all(promises);
}

/**
 * Transform course data to include signed URLs for all media content
 * @param course - Course object with media keys
 * @param isEnrolled - Whether user is enrolled (affects video access)
 * @param expirationHours - Hours until URLs expire (default: 24)
 * @returns Course object with signed URLs
 */
export async function transformCourseWithSignedUrls(
  course: any,
  isEnrolled: boolean = false,
  expirationHours: number = 24
): Promise<any> {
  const transformedCourse = { ...course };

  // Generate signed URL for course image
  if (course.imageUrl) {
    transformedCourse.imageUrl = await generateSignedUrlSafe(
      course.imageUrl,
      'image',
      expirationHours
    );
  }

  // Generate signed URL for course preview video (only if enrolled or free)
  if (course.coursePreviewVideoUrl && (isEnrolled || course.isFree)) {
    transformedCourse.coursePreviewVideoUrl = await generateSignedUrlSafe(
      course.coursePreviewVideoUrl,
      'video',
      expirationHours
    );
  } else if (course.coursePreviewVideoUrl && !isEnrolled && !course.isFree) {
    // Hide video URL for non-enrolled users on paid courses
    transformedCourse.coursePreviewVideoUrl = null;
  }

  return transformedCourse;
}

/**
 * Check if a string is a valid S3 key (basic validation)
 * @param key - String to validate
 * @returns True if it looks like an S3 key
 */
export function isValidS3Key(key: string): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }
  
  // Basic S3 key validation - should not start with http/https
  return !key.startsWith('http://') && !key.startsWith('https://');
}

/**
 * Extract S3 key from URL if it's a full URL, otherwise return as-is
 * @param urlOrKey - URL or S3 key
 * @returns S3 key
 */
export function extractS3Key(urlOrKey: string): string {
  if (!urlOrKey) {
    return urlOrKey;
  }

  // If it's already an S3 key, return as-is
  if (isValidS3Key(urlOrKey)) {
    return urlOrKey;
  }

  // If it's a full URL, extract the key part
  try {
    const url = new URL(urlOrKey);
    // Remove leading slash from pathname
    return url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
  } catch (error) {
    // If URL parsing fails, return original string
    return urlOrKey;
  }
}
