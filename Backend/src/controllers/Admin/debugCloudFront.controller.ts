import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { SecureUrlTestHelper } from '../../utils/secureUrlTestHelper';
import { checkCloudFrontConfiguration } from '../../config/cloudFrontConfig';

/**
 * @desc Debug CloudFront configuration and test signed URL generation
 * @route GET /api/admin/debug/cloudfront
 * @access Private/Admin
 */
export const debugCloudFront = asyncHandler(
  async (req: Request, res: Response) => {
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      configuration: {},
      tests: {},
      recommendations: [],
    };

    try {
      // Check environment variables
      const requiredEnvVars = [
        'CLOUDFRONT_DISTRIBUTION_DOMAIN',
        'CLOUDFRONT_KEY_PAIR_ID',
        'CLOUDFRONT_PRIVATE_KEY',
      ];

      const envStatus: any = {};
      const missingVars: string[] = [];

      requiredEnvVars.forEach(varName => {
        const value = process.env[varName];
        if (!value) {
          missingVars.push(varName);
          envStatus[varName] = { status: 'missing' };
        } else {
          envStatus[varName] = { 
            status: 'present',
            length: value.length,
            preview: varName === 'CLOUDFRONT_PRIVATE_KEY' 
              ? `${value.substring(0, 30)}...${value.substring(value.length - 30)}`
              : value
          };
        }
      });

      debugInfo.configuration.environmentVariables = envStatus;
      debugInfo.configuration.missingVariables = missingVars;

      // Test CloudFront configuration
      debugInfo.configuration.isValid = checkCloudFrontConfiguration();

      // Private key analysis
      if (process.env.CLOUDFRONT_PRIVATE_KEY) {
        const privateKey = process.env.CLOUDFRONT_PRIVATE_KEY;
        debugInfo.configuration.privateKey = {
          length: privateKey.length,
          hasEscapedNewlines: privateKey.includes('\\n'),
          hasActualNewlines: privateKey.includes('\n'),
          hasRSAHeader: privateKey.includes('-----BEGIN RSA PRIVATE KEY-----'),
          hasPKCS8Header: privateKey.includes('-----BEGIN PRIVATE KEY-----'),
          hasRSAFooter: privateKey.includes('-----END RSA PRIVATE KEY-----'),
          hasPKCS8Footer: privateKey.includes('-----END PRIVATE KEY-----'),
        };
      }

      // Test URL generation
      if (debugInfo.configuration.isValid) {
        try {
          // Import here to avoid circular dependency issues
          const { SecureUrlService } = await import('../../services/secureUrlService');
          
          const testKey = 'course-images/debug-test.jpg';
          const result = await SecureUrlService.generateSecureImageUrl(testKey, { expirationHours: 1 });
          
          debugInfo.tests.urlGeneration = {
            status: 'success',
            testKey,
            signedUrl: result.signedUrl,
            expiresAt: result.expiresAt,
          };

          // Analyze the generated URL
          const url = new URL(result.signedUrl);
          debugInfo.tests.urlAnalysis = {
            domain: url.hostname,
            path: url.pathname,
            hasExpires: url.searchParams.has('Expires'),
            hasSignature: url.searchParams.has('Signature'),
            hasKeyPairId: url.searchParams.has('Key-Pair-Id'),
            keyPairIdInUrl: url.searchParams.get('Key-Pair-Id'),
            expiresValue: url.searchParams.get('Expires'),
          };

        } catch (error) {
          debugInfo.tests.urlGeneration = {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
          };
        }
      } else {
        debugInfo.tests.urlGeneration = {
          status: 'skipped',
          reason: 'Configuration is invalid',
        };
      }

      // Generate recommendations
      if (missingVars.length > 0) {
        debugInfo.recommendations.push(`Set missing environment variables: ${missingVars.join(', ')}`);
      }

      if (process.env.CLOUDFRONT_PRIVATE_KEY) {
        const privateKey = process.env.CLOUDFRONT_PRIVATE_KEY;
        if (!privateKey.includes('\\n') && !privateKey.includes('\n')) {
          debugInfo.recommendations.push('Private key appears to be missing newlines. Ensure proper formatting.');
        }
        if (!privateKey.includes('-----BEGIN') || !privateKey.includes('-----END')) {
          debugInfo.recommendations.push('Private key appears to be missing proper headers/footers.');
        }
      }

      if (process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN?.startsWith('https://')) {
        debugInfo.recommendations.push('Remove "https://" from CLOUDFRONT_DISTRIBUTION_DOMAIN - use domain only.');
      }

      if (debugInfo.tests.urlGeneration?.status === 'failed') {
        debugInfo.recommendations.push('URL generation failed. Check CloudFront distribution deployment and key pair association.');
      }

      res.status(200).json({
        success: true,
        message: 'CloudFront debug information generated',
        data: debugInfo,
      });

    } catch (error) {
      console.error('Error in CloudFront debug:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate debug information',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);
