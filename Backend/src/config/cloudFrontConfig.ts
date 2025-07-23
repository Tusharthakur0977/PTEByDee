import { getSignedUrl } from '@aws-sdk/cloudfront-signer';

// CloudFront configuration
export interface CloudFrontConfig {
  distributionDomain: string;
  keyPairId: string;
  privateKey: string;
  defaultExpirationHours: number;
}

// Get CloudFront configuration from environment variables
export const getCloudFrontConfig = (): CloudFrontConfig => {
  const distributionDomain = process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN;
  const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID;
  const privateKey = process.env.CLOUDFRONT_PRIVATE_KEY;

  if (!distributionDomain || !keyPairId || !privateKey) {
    throw new Error(
      'Missing required CloudFront environment variables: CLOUDFRONT_DISTRIBUTION_DOMAIN, CLOUDFRONT_KEY_PAIR_ID, CLOUDFRONT_PRIVATE_KEY'
    );
  }

  return {
    distributionDomain,
    keyPairId,
    privateKey: privateKey.replace(/\\n/g, '\n'), // Handle newlines in environment variable
    defaultExpirationHours: parseInt(process.env.CLOUDFRONT_DEFAULT_EXPIRATION_HOURS || '24'),
  };
};

// Generate signed URL for CloudFront
export const generateSignedUrl = (
  s3Key: string,
  expirationHours?: number
): string => {
  const config = getCloudFrontConfig();
  
  // Calculate expiration time
  const expirationTime = new Date();
  expirationTime.setHours(
    expirationTime.getHours() + (expirationHours || config.defaultExpirationHours)
  );

  // Construct the CloudFront URL
  const url = `https://${config.distributionDomain}/${s3Key}`;

  // Generate signed URL
  const signedUrl = getSignedUrl({
    url,
    keyPairId: config.keyPairId,
    privateKey: config.privateKey,
    dateLessThan: expirationTime.toISOString(),
  });

  return signedUrl;
};

// Generate signed URL for course images
export const generateImageSignedUrl = (
  imageKey: string,
  expirationHours: number = 24
): string => {
  return generateSignedUrl(imageKey, expirationHours);
};

// Generate signed URL for course videos
export const generateVideoSignedUrl = (
  videoKey: string,
  expirationHours: number = 24
): string => {
  return generateSignedUrl(videoKey, expirationHours);
};

// Check if CloudFront is properly configured
export const checkCloudFrontConfiguration = (): boolean => {
  try {
    getCloudFrontConfig();
    return true;
  } catch (error) {
    console.error('CloudFront configuration error:', error);
    return false;
  }
};

// Extract S3 key from full S3 URL
export const extractS3KeyFromUrl = (s3Url: string): string => {
  try {
    const url = new URL(s3Url);
    // Remove leading slash from pathname
    return url.pathname.substring(1);
  } catch (error) {
    // If it's not a full URL, assume it's already a key
    return s3Url;
  }
};
