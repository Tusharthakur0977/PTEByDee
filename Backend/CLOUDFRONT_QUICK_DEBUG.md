# CloudFront Quick Debug Checklist

## 🚨 Most Common Issues (Check These First!)

### 1. Key Pair Setup Issues

**❌ Common Mistake**: Creating key pair as IAM user
**✅ Correct**: Must be created as **root user** in AWS Console

**Steps to fix**:
1. Sign out of AWS Console
2. Sign in as **root user** (not IAM user)
3. Go to CloudFront Console → Security → Public keys
4. Create new key pair
5. Download private key immediately

### 2. Private Key Format

**❌ Wrong format** (literal newlines in .env):
```bash
CLOUDFRONT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA1234567890...
-----END RSA PRIVATE KEY-----"
```

**✅ Correct format** (escaped newlines):
```bash
CLOUDFRONT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA1234567890...\n-----END RSA PRIVATE KEY-----"
```

### 3. Key Pair Not Associated with Distribution

**Check**:
1. CloudFront Console → Your Distribution → Security tab
2. Look for "Trusted key groups" section
3. Ensure your key pair is in a trusted key group
4. Ensure the key group is associated with this distribution

### 4. Distribution Not Deployed

**Check**:
- Distribution status should be "Deployed" (not "In Progress")
- Wait 15-20 minutes after creation
- Try again after deployment completes

### 5. S3 Bucket Policy Missing/Incorrect

**Required policy**:
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
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::YOUR-ACCOUNT-ID:distribution/YOUR-DISTRIBUTION-ID"
        }
      }
    }
  ]
}
```

## 🔧 Quick Debug Commands

### 1. Test Your Configuration
```bash
# Run the debug endpoint
curl -H "Authorization: Bearer YOUR-ADMIN-TOKEN" \
     http://localhost:5000/api/admin/debug/cloudfront

# Or run the test script
npm run test:cloudfront
```

### 2. Test Generated URL
```bash
# Copy a signed URL from the debug output and test it
curl -I "https://your-signed-url-here"

# Should return: HTTP/2 200 
# NOT: HTTP/2 403 (forbidden)
```

### 3. Check Environment Variables
```bash
# In your terminal where you run the app
echo $CLOUDFRONT_DISTRIBUTION_DOMAIN
echo $CLOUDFRONT_KEY_PAIR_ID
echo $CLOUDFRONT_PRIVATE_KEY | head -c 50  # First 50 chars
```

## 🎯 Step-by-Step Fix Process

### Step 1: Verify AWS Setup
- [ ] CloudFront distribution exists and is deployed
- [ ] Key pair created as root user (not IAM)
- [ ] Key pair is in a trusted key group
- [ ] Key group is associated with distribution
- [ ] S3 bucket policy allows CloudFront access

### Step 2: Check Environment Variables
- [ ] All 3 required variables are set
- [ ] Distribution domain has no `https://` prefix
- [ ] Key pair ID matches exactly from AWS Console
- [ ] Private key has escaped newlines (`\n`)

### Step 3: Test Configuration
```bash
# Run debug endpoint
GET /api/admin/debug/cloudfront

# Check the response for specific issues
```

### Step 4: Test URL Generation
```bash
# Generate a test URL
POST /api/admin/secure-url/image
{
  "imageUrl": "course-images/test.jpg",
  "expirationHours": 1
}
```

### Step 5: Test URL Access
```bash
# Try accessing the signed URL
curl -I "https://your-signed-url"
```

## 🔍 Common Error Messages & Solutions

### "CloudFront is not properly configured"
- Missing environment variables
- Check `.env` file exists and is loaded

### "Access Denied" (403) on signed URL
- Key pair not associated with distribution
- Distribution not deployed yet
- S3 bucket policy incorrect

### "Invalid signature" 
- Private key format wrong (missing `\n` escapes)
- Key pair ID mismatch
- Clock skew (check server time)

### URL generation throws error
- Private key malformed
- Missing required environment variables

## 🆘 Still Not Working?

1. **Double-check key pair creation**:
   - Must be created as root user
   - Must be associated with distribution

2. **Verify private key**:
   ```bash
   # Test private key format (save to file first)
   openssl rsa -in private_key.pem -check
   ```

3. **Check CloudFront logs**:
   - Enable logging in CloudFront Console
   - Check S3 logs for 403 errors

4. **Test with AWS CLI**:
   ```bash
   # Generate signed URL with AWS CLI to compare
   aws cloudfront sign --url https://your-distribution.cloudfront.net/test.jpg \
                       --key-pair-id YOUR-KEY-PAIR-ID \
                       --private-key file://private_key.pem \
                       --date-less-than 2024-12-31T23:59:59Z
   ```

## 📞 Need Help?

Run the debug endpoint and share the output (remove sensitive data):
```bash
GET /api/admin/debug/cloudfront
```

This will show exactly what's wrong with your configuration.
