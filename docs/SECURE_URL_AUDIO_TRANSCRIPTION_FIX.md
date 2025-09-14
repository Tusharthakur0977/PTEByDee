# Secure URL Audio Transcription Fix

## Problem Identified

You correctly identified that the audio transcription service was failing because we were storing only the S3 key (e.g., `audio/user-recordings/userId/timestamp.webm`) instead of using secure URLs for downloading audio files.

### Original Error:
```
Error downloading audio from S3: AccessDenied: User: arn:aws:iam::959959865045:user/tusharthakur0977 is not authorized to perform: s3:GetObject on resource: "arn:aws:s3:::pte-by-dee/audio/user-recordings/6887d117d2aa9df7c55a140a/1757848719597.webm" with an explicit deny in an identity-based policy
```

### Root Cause:
The transcription service was attempting direct S3 access using AWS SDK, which required specific IAM permissions. However, the application already has a secure URL service using CloudFront signed URLs that bypasses the need for direct S3 access.

## Solution Implemented

### 1. Enhanced CloudFront Configuration

Added audio file support to the CloudFront configuration:

```typescript
// Generate signed URL for audio files
export const generateAudioSignedUrl = (
  audioKey: string,
  expirationHours: number = 24
): string => {
  return generateSignedUrl(audioKey, expirationHours);
};
```

### 2. Extended SecureUrlService

Added audio URL generation method to the existing SecureUrlService:

```typescript
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
```

### 3. Refactored Audio Transcription Service

Completely replaced the S3 direct access approach with secure URL-based downloading:

#### Before (Direct S3 Access):
```typescript
// Required S3 permissions and direct AWS SDK calls
const command = new GetObjectCommand({
  Bucket: process.env.AWS_S3_BUCKET_NAME!,
  Key: audioKey,
});
const response = await s3Client.send(command);
```

#### After (Secure URL Access):
```typescript
// Uses CloudFront signed URLs - no S3 permissions needed
const secureUrlResponse = await SecureUrlService.generateSecureAudioUrl(audioKey, {
  expirationHours: 1 // Short expiration for transcription processing
});

// Download using standard HTTP request
const url = new URL(secureUrlResponse.signedUrl);
const client = url.protocol === 'https:' ? https : http;
```

### 4. Enhanced Error Handling

Improved error messages for different failure scenarios:

```typescript
// Provide specific error messages based on error type
if (error.message?.includes('CloudFront')) {
  throw new Error('CloudFront configuration error: Unable to generate secure URL for audio file.');
} else if (error.message?.includes('403') || error.message?.includes('Access')) {
  throw new Error('Access denied: Unable to access audio file. Please check permissions.');
} else if (error.message?.includes('404') || error.message?.includes('Not Found')) {
  throw new Error('Audio file not found in storage.');
}
```

## Benefits of This Approach

### 1. **No IAM Permission Issues**
- Eliminates the need for `s3:GetObject` permissions on the backend
- Uses the existing CloudFront distribution that's already configured
- Consistent with how images and videos are served in the application

### 2. **Better Security**
- Time-limited access (1 hour for transcription processing)
- Signed URLs prevent unauthorized access
- No need to store AWS credentials with broad S3 permissions

### 3. **Consistency**
- Uses the same secure URL pattern as images and videos
- Leverages existing CloudFront infrastructure
- Maintains consistent error handling patterns

### 4. **Performance**
- CloudFront edge locations provide faster downloads
- Reduced load on S3 bucket
- Better global performance for audio processing

## Technical Implementation Details

### Audio Download Flow:
1. **Input**: S3 key (e.g., `audio/user-recordings/userId/timestamp.webm`)
2. **Generate Secure URL**: Create CloudFront signed URL with 1-hour expiration
3. **Download**: Use Node.js HTTPS client to download file
4. **Save Temporarily**: Store in temp directory for OpenAI processing
5. **Process**: Send to OpenAI Whisper for transcription
6. **Cleanup**: Remove temporary file after processing

### Error Handling:
- **CloudFront Configuration Errors**: Clear message about setup issues
- **HTTP Errors**: Specific status code handling (403, 404, etc.)
- **Download Timeouts**: 30-second timeout with proper cleanup
- **File System Errors**: Proper cleanup of partial downloads

### Security Features:
- **Short Expiration**: 1-hour URLs for transcription processing
- **Automatic Cleanup**: Temporary files are always removed
- **Timeout Protection**: Prevents hanging downloads
- **Error Isolation**: Specific error messages without exposing internals

## Testing the Fix

### 1. Verify CloudFront Configuration:
```bash
# Check environment variables
echo $CLOUDFRONT_DISTRIBUTION_DOMAIN
echo $CLOUDFRONT_KEY_PAIR_ID
echo $CLOUDFRONT_PRIVATE_KEY
```

### 2. Test Audio Upload and Transcription:
1. Record a Read Aloud response
2. Check server logs for:
   ```
   Starting transcription process for audio key: audio/user-recordings/...
   Attempting to download audio file: audio/user-recordings/...
   Generated secure URL for audio download
   Audio file downloaded successfully to: /path/to/temp/file
   Sending audio to OpenAI Whisper for transcription...
   Transcription completed. Text length: XXX characters
   ```

### 3. Expected Behavior:
- ✅ Audio uploads successfully to S3
- ✅ Secure URL generation succeeds
- ✅ Audio downloads via CloudFront
- ✅ OpenAI Whisper transcription works
- ✅ Evaluation and feedback provided

## Backward Compatibility

- **No Breaking Changes**: Existing audio upload functionality unchanged
- **Same API**: Frontend continues to work without modifications
- **Same Storage**: Audio files still stored in S3 with same key structure
- **Enhanced Security**: Better security without affecting user experience

## Environment Requirements

Ensure these CloudFront environment variables are set:
```bash
CLOUDFRONT_DISTRIBUTION_DOMAIN=your-distribution.cloudfront.net
CLOUDFRONT_KEY_PAIR_ID=your-key-pair-id
CLOUDFRONT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
CLOUDFRONT_DEFAULT_EXPIRATION_HOURS=24
```

## Troubleshooting

### Common Issues:

1. **CloudFront Not Configured**: Check environment variables
2. **Invalid Signed URLs**: Verify private key format and key pair ID
3. **Download Timeouts**: Check network connectivity and CloudFront distribution
4. **File Not Found**: Verify audio key format and S3 storage

### Debug Steps:

1. Test secure URL generation manually
2. Check CloudFront distribution status
3. Verify audio file exists in S3
4. Test download with generated URL
5. Check OpenAI API key and quota

This solution eliminates the IAM permission issues while providing a more secure, performant, and maintainable approach to audio file access for transcription processing.
