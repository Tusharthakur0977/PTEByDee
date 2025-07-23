# CloudFront Secure Content Delivery Setup

This document provides instructions for setting up CloudFront with signed URLs
to securely serve private S3 content.

## Overview

Your application now uploads images and videos as **private** files to S3 and
serves them through CloudFront with time-limited signed URLs for enhanced
security.

## Required AWS Setup

### 1. Create CloudFront Key Pair

1. **Sign in to AWS Console** as the root user (not IAM user)
2. **Go to CloudFront Console** → Security → Public keys
3. **Create a new key pair**:
   - Click "Create public key"
   - Upload your public key or generate a new one
   - Note down the **Key Pair ID**
4. **Download the private key** and store it securely

### 2. Create CloudFront Distribution

1. **Go to CloudFront Console** → Distributions
2. **Create Distribution** with these settings:
   - **Origin Domain**: Your S3 bucket (e.g.,
     `ptebydee-uploads.s3.ap-southeast-2.amazonaws.com`)
   - **Origin Access**: Origin Access Control (OAC) - recommended
   - **Viewer Protocol Policy**: Redirect HTTP to HTTPS
   - **Restrict Viewer Access**: Yes
   - **Trusted Key Groups**: Select the key group containing your key pair
3. **Note the Distribution Domain Name** (e.g., `d123456789.cloudfront.net`)

### 3. Update S3 Bucket Policy

Update your S3 bucket policy to only allow CloudFront access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::your-account-id:distribution/your-distribution-id"
        }
      }
    }
  ]
}
```

## Environment Variables

Add these environment variables to your application:

```bash
# CloudFront Configuration
CLOUDFRONT_DISTRIBUTION_DOMAIN=d123456789.cloudfront.net
CLOUDFRONT_KEY_PAIR_ID=your-key-pair-id
CLOUDFRONT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nYour private key content here\n-----END RSA PRIVATE KEY-----"
CLOUDFRONT_DEFAULT_EXPIRATION_HOURS=24
```

**Note**: For the private key, replace actual newlines with `\n` in the
environment variable.

## API Endpoints

### Generate Secure Image URL

```http
POST /api/admin/secure-url/image
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "imageUrl": "course-images/1640995200000-abc123def456.jpg",
  "expirationHours": 24
}
```

**Response:**

```json
{
  "success": true,
  "message": "Secure image URL generated successfully",
  "data": {
    "originalUrl": "course-images/1640995200000-abc123def456.jpg",
    "secureUrl": "https://d123456789.cloudfront.net/course-images/1640995200000-abc123def456.jpg?Expires=...",
    "expiresAt": "2024-01-02T12:00:00.000Z",
    "expirationHours": 24
  }
}
```

### Generate Secure Video URL

```http
POST /api/admin/secure-url/video
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "videoUrl": "course-videos/1640995200000-xyz789def456.mp4",
  "expirationHours": 48
}
```

### Generate Multiple Secure URLs

```http
POST /api/admin/secure-url/images
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "imageUrls": [
    "course-images/image1.jpg",
    "course-images/image2.png"
  ],
  "expirationHours": 12
}
```

## Security Features

### ✅ Private S3 Storage

- Files are uploaded without public ACL
- Direct S3 access is blocked
- Only CloudFront can access the files

### ✅ Time-Limited Access

- URLs expire after specified hours (default: 24)
- Maximum expiration: 168 hours (7 days)
- Automatic cleanup of expired URLs

### ✅ Signed URLs

- URLs are cryptographically signed
- Cannot be modified or extended
- Unique per request

### ✅ Admin-Only Generation

- Only admin users can generate signed URLs
- Protected by authentication middleware
- Audit trail in application logs

## Usage in Frontend

1. **Upload files** using existing upload endpoints
2. **Store S3 keys** in your database (not full URLs)
3. **Generate signed URLs** when needed for display
4. **Cache signed URLs** on frontend until expiration
5. **Regenerate URLs** when they expire

## Testing

1. **Upload a file** using the existing upload endpoints
2. **Verify the file is private** by trying to access the S3 URL directly
   (should fail)
3. **Generate a signed URL** using the new endpoints
4. **Access the content** using the signed URL (should work)
5. **Wait for expiration** and verify the URL no longer works

## Troubleshooting

### Step-by-Step Debugging

1. **Run the test script first**:

   ```bash
   npm run test:cloudfront
   ```

2. **Check the detailed output** for specific issues

### Common Issues & Solutions

#### 1. "CloudFront is not properly configured"

**Cause**: Missing or incorrect environment variables

**Solution**:

```bash
# Check your .env file has all required variables
CLOUDFRONT_DISTRIBUTION_DOMAIN=d123456789.cloudfront.net
CLOUDFRONT_KEY_PAIR_ID=APKA1234567890EXAMPLE
CLOUDFRONT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----"
```

#### 2. "Access Denied" when accessing signed URLs

**Possible Causes & Solutions**:

a) **CloudFront distribution not deployed**

- Wait 15-20 minutes after creating distribution
- Check distribution status is "Deployed" in AWS Console

b) **Key pair not associated with distribution**

- Go to CloudFront Console → Your Distribution → Security
- Ensure your key pair is in a trusted key group
- Verify the key group is associated with the distribution

c) **S3 bucket policy incorrect**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::YOUR-ACCOUNT-ID:distribution/YOUR-DISTRIBUTION-ID"
        }
      }
    }
  ]
}
```

#### 3. Private Key Format Issues

**Wrong format** (will fail):

```bash
CLOUDFRONT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----"
```

**Correct format** (escaped newlines):

```bash
CLOUDFRONT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----"
```

#### 4. Key Pair ID Mismatch

**Check your key pair ID**:

1. Go to CloudFront Console → Public keys
2. Find your key and copy the exact ID
3. Ensure it matches `CLOUDFRONT_KEY_PAIR_ID`

#### 5. Distribution Domain Issues

**Wrong format**:

```bash
CLOUDFRONT_DISTRIBUTION_DOMAIN=https://d123456789.cloudfront.net
```

**Correct format** (no protocol):

```bash
CLOUDFRONT_DISTRIBUTION_DOMAIN=d123456789.cloudfront.net
```

### Advanced Debugging

#### Test with curl

```bash
# Test if your signed URL works
curl -I "https://your-signed-url-here"

# Should return 200 OK, not 403 Forbidden
```

#### Check CloudFront logs

1. Enable CloudFront logging in AWS Console
2. Check logs in S3 for error details
3. Look for 403 errors and their causes

#### Verify key pair manually

```bash
# Test if your private key is valid
openssl rsa -in private_key.pem -check
```

### Logs

Check application logs for detailed error messages:

```bash
# Run the test script for detailed debugging
npm run test:cloudfront

# Look for specific error patterns:
Error generating secure image URL: [detailed error message]
```

### Still Having Issues?

1. **Double-check AWS setup**:

   - CloudFront distribution is deployed
   - Key pair exists and is associated
   - S3 bucket policy is correct

2. **Verify environment variables**:

   - All variables are set
   - Private key format is correct
   - No extra spaces or characters

3. **Test with a simple file**:
   - Upload a test image to S3
   - Generate signed URL
   - Try accessing it directly
