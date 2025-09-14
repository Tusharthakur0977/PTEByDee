import {
  generateImageSignedUrl,
  generateVideoSignedUrl,
  generateAudioSignedUrl,
  extractS3KeyFromUrl,
  checkCloudFrontConfiguration,
} from '../config/cloudFrontConfig';

export interface SecureUrlOptions {
  expirationHours?: number;
}

export interface SecureUrlResponse {
  signedUrl: string;
  expiresAt: string;
  expirationHours: number;
}

/**
 * Service for generating secure, time-limited URLs for private S3 content
 */
export class SecureUrlService {
  /**
   * Generate a secure signed URL for an image
   * @param imageUrl - The S3 URL or key of the image
   * @param options - Configuration options for the signed URL
   * @returns Promise with signed URL and expiration info
   */
  static async generateSecureImageUrl(
    imageUrl: string,
    options: SecureUrlOptions = {}
  ): Promise<SecureUrlResponse> {
    if (!checkCloudFrontConfiguration()) {
      throw new Error('CloudFront is not properly configured');
    }

    const { expirationHours = 24 } = options;
    const s3Key = extractS3KeyFromUrl(imageUrl);

    const signedUrl = generateImageSignedUrl(s3Key, expirationHours);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    return {
      signedUrl,
      expiresAt: expiresAt.toISOString(),
      expirationHours,
    };
  }

  /**
   * Generate a secure signed URL for a video
   * @param videoUrl - The S3 URL or key of the video
   * @param options - Configuration options for the signed URL
   * @returns Promise with signed URL and expiration info
   */
  static async generateSecureVideoUrl(
    videoUrl: string,
    options: SecureUrlOptions = {}
  ): Promise<SecureUrlResponse> {
    if (!checkCloudFrontConfiguration()) {
      throw new Error('CloudFront is not properly configured');
    }

    const { expirationHours = 24 } = options;
    const s3Key = extractS3KeyFromUrl(videoUrl);

    const signedUrl = generateVideoSignedUrl(s3Key, expirationHours);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    return {
      signedUrl,
      expiresAt: expiresAt.toISOString(),
      expirationHours,
    };
  }

  /**
   * Generate a secure signed URL for an audio file
   * @param audioUrl - The S3 URL or key of the audio file
   * @param options - Configuration options for the signed URL
   * @returns Promise with signed URL and expiration info
   */
  static async generateSecureAudioUrl(
    audioUrl: string,
    options: SecureUrlOptions = {}
  ): Promise<SecureUrlResponse> {
    if (!checkCloudFrontConfiguration()) {
      throw new Error('CloudFront is not properly configured');
    }

    const { expirationHours = 24 } = options;
    const s3Key = extractS3KeyFromUrl(audioUrl);

    const signedUrl = generateAudioSignedUrl(s3Key, expirationHours);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    return {
      signedUrl,
      expiresAt: expiresAt.toISOString(),
      expirationHours,
    };
  }

  /**
   * Generate secure signed URLs for multiple images
   * @param imageUrls - Array of S3 URLs or keys
   * @param options - Configuration options for the signed URLs
   * @returns Promise with array of signed URL responses
   */
  static async generateSecureImageUrls(
    imageUrls: string[],
    options: SecureUrlOptions = {}
  ): Promise<SecureUrlResponse[]> {
    const promises = imageUrls.map((url) =>
      this.generateSecureImageUrl(url, options)
    );

    return Promise.all(promises);
  }

  /**
   * Generate secure signed URLs for multiple videos
   * @param videoUrls - Array of S3 URLs or keys
   * @param options - Configuration options for the signed URLs
   * @returns Promise with array of signed URL responses
   */
  static async generateSecureVideoUrls(
    videoUrls: string[],
    options: SecureUrlOptions = {}
  ): Promise<SecureUrlResponse[]> {
    const promises = videoUrls.map((url) =>
      this.generateSecureVideoUrl(url, options)
    );

    return Promise.all(promises);
  }

  /**
   * Check if CloudFront is properly configured
   * @returns boolean indicating if CloudFront is configured
   */
  static isConfigured(): boolean {
    return checkCloudFrontConfiguration();
  }

  /**
   * Get the S3 key from a URL (for debugging/utility purposes)
   * @param url - The S3 URL
   * @returns The extracted S3 key
   */
  static extractKey(url: string): string {
    return extractS3KeyFromUrl(url);
  }
}
