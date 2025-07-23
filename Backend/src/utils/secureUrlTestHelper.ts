import { SecureUrlService } from '../services/secureUrlService';
import { checkCloudFrontConfiguration } from '../config/cloudFrontConfig';

/**
 * Utility functions for testing and debugging secure URL functionality
 */
export class SecureUrlTestHelper {
  /**
   * Test CloudFront configuration
   */
  static testConfiguration(): void {
    console.log('🔍 Testing CloudFront Configuration...');

    const requiredEnvVars = [
      'CLOUDFRONT_DISTRIBUTION_DOMAIN',
      'CLOUDFRONT_KEY_PAIR_ID',
      'CLOUDFRONT_PRIVATE_KEY',
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      console.error('❌ Missing environment variables:', missingVars);
      return;
    }

    console.log('✅ All required environment variables are set');
    console.log('📋 Environment variables:');
    console.log(
      `   CLOUDFRONT_DISTRIBUTION_DOMAIN: ${process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN}`
    );
    console.log(
      `   CLOUDFRONT_KEY_PAIR_ID: ${process.env.CLOUDFRONT_KEY_PAIR_ID}`
    );
    console.log(
      `   CLOUDFRONT_DEFAULT_EXPIRATION_HOURS: ${
        process.env.CLOUDFRONT_DEFAULT_EXPIRATION_HOURS || '24'
      }`
    );

    const isConfigured = checkCloudFrontConfiguration();
    if (isConfigured) {
      console.log('✅ CloudFront configuration is valid');
    } else {
      console.error('❌ CloudFront configuration is invalid');
    }

    // Test private key format
    const privateKey = process.env.CLOUDFRONT_PRIVATE_KEY!;
    console.log('🔑 Private key analysis:');
    console.log(`   Length: ${privateKey.length} characters`);
    console.log(`   Starts with: ${privateKey.substring(0, 30)}...`);
    console.log(
      `   Ends with: ...${privateKey.substring(privateKey.length - 30)}`
    );

    if (privateKey.includes('\\n')) {
      console.log(
        '✅ Private key has escaped newlines (\\n) - correct for env var'
      );
    } else if (privateKey.includes('\n')) {
      console.log('✅ Private key has actual newlines');
    } else {
      console.warn(
        '⚠️  Private key format may be incorrect (no newlines detected)'
      );
    }

    if (privateKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
      console.log('✅ Private key has correct RSA header');
    } else if (privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      console.log('✅ Private key has correct PKCS#8 header');
    } else {
      console.error('❌ Private key missing proper header');
    }

    if (
      privateKey.includes('-----END RSA PRIVATE KEY-----') ||
      privateKey.includes('-----END PRIVATE KEY-----')
    ) {
      console.log('✅ Private key has correct footer');
    } else {
      console.error('❌ Private key missing proper footer');
    }
  }

  /**
   * Test generating a signed URL for a sample image
   */
  static async testImageUrl(
    sampleKey: string = 'course-images/test-image.jpg'
  ): Promise<void> {
    console.log('🔍 Testing image URL generation...');
    console.log(`📁 Testing with key: ${sampleKey}`);

    try {
      const result = await SecureUrlService.generateSecureImageUrl(sampleKey, {
        expirationHours: 1,
      });
      console.log('✅ Image URL generated successfully');
      console.log('📋 Full signed URL:', result.signedUrl);
      console.log('📋 Sample response:', {
        originalKey: sampleKey,
        signedUrlPreview: result.signedUrl.substring(0, 100) + '...',
        expiresAt: result.expiresAt,
        expirationHours: result.expirationHours,
      });

      // Test URL structure
      const url = new URL(result.signedUrl);
      console.log('🔗 URL Analysis:');
      console.log(`   Domain: ${url.hostname}`);
      console.log(`   Path: ${url.pathname}`);
      console.log(`   Has Expires param: ${url.searchParams.has('Expires')}`);
      console.log(
        `   Has Signature param: ${url.searchParams.has('Signature')}`
      );
      console.log(
        `   Has Key-Pair-Id param: ${url.searchParams.has('Key-Pair-Id')}`
      );
    } catch (error) {
      console.error('❌ Failed to generate image URL:', error);
      if (error instanceof Error) {
        console.error('❌ Error details:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
    }
  }

  /**
   * Test generating a signed URL for a sample video
   */
  static async testVideoUrl(
    sampleKey: string = 'course-videos/test-video.mp4'
  ): Promise<void> {
    console.log('🔍 Testing video URL generation...');

    try {
      const result = await SecureUrlService.generateSecureVideoUrl(sampleKey, {
        expirationHours: 2,
      });
      console.log('✅ Video URL generated successfully');
      console.log('📋 Sample response:', {
        originalKey: sampleKey,
        signedUrl: result.signedUrl.substring(0, 100) + '...',
        expiresAt: result.expiresAt,
        expirationHours: result.expirationHours,
      });
    } catch (error) {
      console.error('❌ Failed to generate video URL:', error);
    }
  }

  /**
   * Test URL extraction utility
   */
  static testUrlExtraction(): void {
    console.log('🔍 Testing URL extraction...');

    const testCases = [
      'course-images/test.jpg',
      'https://bucket.s3.region.amazonaws.com/course-images/test.jpg',
      'https://d123456789.cloudfront.net/course-videos/test.mp4',
    ];

    testCases.forEach((testUrl) => {
      const extracted = SecureUrlService.extractKey(testUrl);
      console.log(`📋 "${testUrl}" → "${extracted}"`);
    });
  }

  /**
   * Run all tests
   */
  static async runAllTests(): Promise<void> {
    console.log('🚀 Running CloudFront Secure URL Tests...\n');

    this.testConfiguration();
    console.log('');

    this.testUrlExtraction();
    console.log('');

    await this.testImageUrl();
    console.log('');

    await this.testVideoUrl();
    console.log('');

    console.log('✅ All tests completed!');
  }
}

// Export for use in scripts or debugging
export default SecureUrlTestHelper;
