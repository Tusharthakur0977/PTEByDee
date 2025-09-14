# AWS S3 Permissions Fix for Audio Transcription

## Problem

The audio transcription service is failing with the following error:

```
Error downloading audio from S3: AccessDenied: User: arn:aws:iam::959959865045:user/tusharthakur0977 is not authorized to perform: s3:GetObject on resource: "arn:aws:s3:::pte-by-dee/audio/user-recordings/6887d117d2aa9df7c55a140a/1757848719597.webm" with an explicit deny in an identity-based policy
```

This indicates that the IAM user `tusharthakur0977` doesn't have the necessary permissions to download (GetObject) files from the S3 bucket for transcription processing.

## Root Cause

The current IAM policy for the user likely only includes `s3:PutObject` permissions for uploading files, but is missing `s3:GetObject` permissions required for the transcription service to download and process the audio files.

## Solution

### Step 1: Update IAM User Policy

You need to update the IAM policy for user `tusharthakur0977` to include the necessary S3 permissions.

#### Required IAM Policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::pte-by-dee/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::pte-by-dee"
        }
    ]
}
```

#### How to Apply the Policy:

1. **Via AWS Console:**
   - Go to AWS IAM Console
   - Navigate to Users → `tusharthakur0977`
   - Go to Permissions tab
   - Click "Add permissions" → "Attach policies directly"
   - Create a new policy with the JSON above
   - Name it something like "PTE-S3-FullAccess"
   - Attach it to the user

2. **Via AWS CLI:**
   ```bash
   # Create the policy document (save as pte-s3-policy.json)
   aws iam put-user-policy \
     --user-name tusharthakur0977 \
     --policy-name PTE-S3-FullAccess \
     --policy-document file://pte-s3-policy.json
   ```

### Step 2: Verify Permissions

After updating the policy, test the permissions:

```bash
# Test upload permission
aws s3 cp test-file.txt s3://pte-by-dee/test/

# Test download permission  
aws s3 cp s3://pte-by-dee/test/test-file.txt ./downloaded-file.txt

# Test list permission
aws s3 ls s3://pte-by-dee/audio/user-recordings/
```

### Step 3: Alternative Solution - Use IAM Roles (Recommended)

For better security, consider using IAM roles instead of user credentials:

#### Create an IAM Role:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ec2.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
```

#### Attach the S3 Policy to the Role:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::pte-by-dee",
                "arn:aws:s3:::pte-by-dee/*"
            ]
        }
    ]
}
```

## Enhanced Error Handling

I've also improved the error handling in the transcription service to provide better error messages:

### New Error Messages:

- **Access Denied**: "Access denied: Insufficient permissions to download audio file from S3. Please check IAM permissions."
- **File Not Found**: "Audio file not found in S3 storage."
- **Bucket Not Found**: "S3 bucket not found. Please check bucket configuration."
- **Generic S3 Error**: "Failed to download audio file from S3: [specific error message]"

### Debugging Information:

The service now logs:
- Audio key being processed
- File download attempts
- File sizes
- Transcription progress
- Completion status

## Testing the Fix

### 1. Test Audio Upload:
```bash
curl -X POST http://localhost:5000/api/user/upload-audio \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "audio=@test-audio.webm"
```

### 2. Test Audio Transcription:
Submit a Read Aloud question response and check the server logs for:
```
Starting transcription process for audio key: audio/user-recordings/...
Attempting to download audio file: audio/user-recordings/...
Audio file downloaded successfully to: /path/to/temp/file
Audio file size: XXXX bytes
Sending audio to OpenAI Whisper for transcription...
Transcription completed. Text length: XXX characters
```

### 3. Check for Errors:
If you still see permission errors, verify:
- The IAM policy is correctly attached
- The AWS credentials in your environment variables are correct
- The S3 bucket name matches exactly
- The audio file path is correct

## Environment Variables

Ensure these are set correctly:

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_S3_BUCKET_NAME=pte-by-dee
OPENAI_API_KEY=your_openai_api_key
```

## Security Best Practices

1. **Principle of Least Privilege**: Only grant the minimum permissions needed
2. **Use IAM Roles**: When possible, use roles instead of user credentials
3. **Rotate Credentials**: Regularly rotate access keys
4. **Monitor Access**: Use CloudTrail to monitor S3 access
5. **Bucket Policies**: Consider using bucket policies for additional security

## Troubleshooting

### Common Issues:

1. **Policy Not Applied**: Wait a few minutes for IAM changes to propagate
2. **Wrong Bucket Name**: Verify the bucket name in environment variables
3. **Region Mismatch**: Ensure AWS_REGION matches your bucket's region
4. **Credential Issues**: Verify AWS credentials are correctly set

### Debug Steps:

1. Check IAM user permissions in AWS Console
2. Test S3 access with AWS CLI
3. Verify environment variables
4. Check server logs for detailed error messages
5. Test with a simple S3 operation first

## Expected Behavior After Fix

Once the permissions are correctly set:

1. User records audio → Upload succeeds
2. User submits response → Audio downloads from S3 successfully
3. Audio transcription with OpenAI Whisper succeeds
4. Transcribed text is evaluated and feedback provided
5. User receives detailed evaluation results

The entire audio flow should work seamlessly without permission errors.
