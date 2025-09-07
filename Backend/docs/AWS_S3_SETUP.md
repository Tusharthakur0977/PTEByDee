# AWS S3 Image Upload Setup

This document provides instructions for setting up AWS S3 for course image
uploads in the PTE By DEE application.

> **⚠️ IMPORTANT**: This setup is now deprecated in favor of secure CloudFront
> delivery. See `CLOUDFRONT_SECURE_SETUP.md` for the new secure implementation
> with private S3 storage and signed URLs.

## Required Environment Variables

Add the following environment variables to your production environment (AWS
Systems Manager Parameter Store):


### AWS S3 Configuration

```bash
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=ap-southeast-2
AWS_S3_BUCKET_NAME=ptebydee-uploads
```

## AWS S3 Bucket Setup

### 1. Create S3 Bucket

1. Log in to AWS Console
2. Navigate to S3 service
3. Click "Create bucket"
4. Bucket name: `ptebydee-uploads` (or your preferred name)
5. Region: `ap-southeast-2` (Sydney) or your preferred region
6. Keep default settings for now

### 2. Configure Bucket Permissions

#### Bucket Policy

Add the following bucket policy to allow public read access to uploaded images:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::ptebydee-uploads/*"
    }
  ]
}
```

#### CORS Configuration

Add CORS configuration to allow uploads from your frontend:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://pte-by-dee.vercel.app",
      "https://your-domain.com"
    ],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 3. Create IAM User for S3 Access

#### Create IAM User

1. Navigate to IAM service in AWS Console
2. Click "Users" → "Add user"
3. Username: `ptebydee-s3-user`
4. Access type: "Programmatic access"
5. Click "Next: Permissions"

#### Attach Policy

Create a custom policy with the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::ptebydee-uploads/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::ptebydee-uploads"
    }
  ]
}
```

#### Save Credentials

After creating the user, save the Access Key ID and Secret Access Key securely.

## Environment Variable Setup

### Development (.env file)

Create a `.env` file in the Backend directory:

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=ap-southeast-2
AWS_S3_BUCKET_NAME=ptebydee-uploads
```

### Production (AWS Systems Manager Parameter Store)

Add the following parameters to AWS Systems Manager Parameter Store:

```bash
# Add these parameters with SecureString type
/ptebydee-server/production/AWS_ACCESS_KEY_ID
/ptebydee-server/production/AWS_SECRET_ACCESS_KEY
/ptebydee-server/production/AWS_S3_BUCKET_NAME
/ptebydee-server/production/AWS_REGION
```

### Update application_start.sh

Add the following lines to your `scripts/application_start.sh` file:

```bash
# Fetch AWS configuration from Parameter Store
echo "Fetching AWS_ACCESS_KEY_ID from Parameter Store..."
export AWS_ACCESS_KEY_ID=$(aws ssm get-parameter --name "/ptebydee-server/production/AWS_ACCESS_KEY_ID" --with-decryption --query Parameter.Value --output text --region ap-southeast-2)

echo "Fetching AWS_SECRET_ACCESS_KEY from Parameter Store..."
export AWS_SECRET_ACCESS_KEY=$(aws ssm get-parameter --name "/ptebydee-server/production/AWS_SECRET_ACCESS_KEY" --with-decryption --query Parameter.Value --output text --region ap-southeast-2)

echo "Fetching AWS_S3_BUCKET_NAME from Parameter Store..."
export AWS_S3_BUCKET_NAME=$(aws ssm get-parameter --name "/ptebydee-server/production/AWS_S3_BUCKET_NAME" --with-decryption --query Parameter.Value --output text --region ap-southeast-2)

echo "Fetching AWS_REGION from Parameter Store..."
export AWS_REGION=$(aws ssm get-parameter --name "/ptebydee-server/production/AWS_REGION" --with-decryption --query Parameter.Value --output text --region ap-southeast-2)
```

## File Upload Specifications

### Supported File Types

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

### File Size Limits

- Maximum file size: 5MB
- Recommended dimensions: 1200x800 pixels or similar aspect ratio

### File Naming Convention

Files are automatically renamed using the pattern:

```
course-images/{timestamp}-{randomString}.{extension}
```

Example: `course-images/1640995200000-abc123def456.jpg`

## API Endpoints

### Upload Course Image

```
POST /api/admin/upload/course-image
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
- courseImage: File (required)
```

### Response Format

```json
{
  "success": true,
  "message": "Image uploaded successfully.",
  "data": {
    "imageUrl": "https://ptebydee-uploads.s3.ap-southeast-2.amazonaws.com/course-images/1640995200000-abc123def456.jpg",
    "fileName": "course-images/1640995200000-abc123def456.jpg",
    "fileSize": 1024000,
    "mimeType": "image/jpeg"
  }
}
```

## Security Considerations

1. **IAM Permissions**: Use least privilege principle - only grant necessary S3
   permissions
2. **Bucket Policy**: Only allow public read access, not write access
3. **File Validation**: Server-side validation for file type and size
4. **CORS**: Restrict allowed origins to your domains only
5. **Environment Variables**: Store AWS credentials securely in Parameter Store

## Troubleshooting

### Common Issues

1. **Access Denied Error**

   - Check IAM user permissions
   - Verify bucket policy
   - Ensure correct AWS credentials

2. **CORS Error**

   - Update CORS configuration in S3 bucket
   - Add your frontend domain to allowed origins

3. **File Upload Fails**

   - Check file size (max 5MB)
   - Verify file type is supported
   - Check network connectivity

4. **Environment Variables Not Found**
   - Verify parameter names in Systems Manager
   - Check application_start.sh script
   - Ensure AWS CLI is properly configured

### Testing the Setup

You can test the S3 configuration by:

1. Starting the backend server
2. Checking the console for any S3 configuration errors
3. Using the course creation/editing forms to upload an image
4. Verifying the image appears in your S3 bucket
5. Confirming the image URL is accessible publicly

## Support

For additional support with AWS S3 setup, refer to:

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS IAM Documentation](https://docs.aws.amazon.com/iam/)
- [AWS Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
