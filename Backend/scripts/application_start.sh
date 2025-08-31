#!/bin/bash

echo "Starting ApplicationStart hook (final attempt at timeout fix with minimal commands)..."

APP_DIR="/home/ubuntu/ptebydee-server"
cd "$APP_DIR" || { echo "Failed to change to application directory: $APP_DIR"; exit 1; }

# --- Verify Node.js, npm, AWS CLI availability (installed by BeforeInstall) ---
node -v || { echo "ERROR: Node.js is not found or not in PATH. Check BeforeInstall hook."; exit 1; }
npm -v || { echo "ERROR: npm is not found or not in PATH. Check BeforeInstall hook."; exit 1; }
if ! command -v aws &> /dev/null; then
    echo "ERROR: AWS CLI not found. Cannot fetch parameters from SSM. This should have been handled by BeforeInstall hook."
    exit 1
fi

# --- Fetch Environment Variables from AWS Systems Manager Parameter Store ---
fetch_and_export_param() {
    local param_name="$1"
    local env_var_name="$2"
    local region="ap-southeast-2" # Your AWS region

    echo "Fetching $env_var_name from Parameter Store..."
    local param_value=$(aws ssm get-parameter --name "$param_name" --with-decryption --query Parameter.Value --output text --region "$region" 2>&1)

    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to fetch $param_name from Parameter Store. Output: $param_value"
        echo "Please check IAM permissions for the EC2 instance and ensure the parameter exists and is accessible."
        exit 1
    fi

    if [ -z "$param_value" ]; then
        echo "WARNING: Parameter $param_name fetched successfully but its value is empty. This might cause application issues."
    fi


    export "$env_var_name"="$param_value"
    echo "$env_var_name : $param_value fetched (value hidden in logs for security)."
}

# Fetch all your parameters
fetch_and_export_param "/ptebydee-server/production/DATABASE_URL" "DATABASE_URL"
fetch_and_export_param "/ptebydee-server/production/EMAIL_APP_PASSWORD" "EMAIL_APP_PASSWORD"
fetch_and_export_param "/ptebydee-server/production/GOOGLE_CLIENT_ID" "GOOGLE_CLIENT_ID"
fetch_and_export_param "/ptebydee-server/production/GOOGLE_CLIENT_SECRET" "GOOGLE_CLIENT_SECRET"
fetch_and_export_param "/ptebydee-server/production/JWT_REFRESH_SECRET" "JWT_REFRESH_SECRET"
fetch_and_export_param "/ptebydee-server/production/JWT_SECRET" "JWT_SECRET"
# fetch_and_export_param "/ptebydee-server/production/AWS_ACCESS_KEY_ID" "AWS_ACCESS_KEY_ID"
# fetch_and_export_param "/ptebydee-server/production/AWS_SECRET_ACCESS_KEY" "AWS_SECRET_ACCESS_KEY"
# fetch_and_export_param "/ptebydee-server/production/AWS_S3_BUCKET_NAME" "AWS_S3_BUCKET_NAME"
fetch_and_export_param "/ptebydee-server/production/CLOUDFRONT_DISTRIBUTION_DOMAIN" "CLOUDFRONT_DISTRIBUTION_DOMAIN"
fetch_and_export_param "/ptebydee-server/production/CLOUDFRONT_KEY_PAIR_ID" "CLOUDFRONT_KEY_PAIR_ID"
fetch_and_export_param "/ptebydee-server/production/CLOUDFRONT_PRIVATE_KEY" "CLOUDFRONT_PRIVATE_KEY"
fetch_and_export_param "/ptebydee-server/production/CLOUDFRONT_DEFAULT_EXPIRATION_HOURS" "CLOUDFRONT_DEFAULT_EXPIRATION_HOURS"
fetch_and_export_param "/ptebydee-server/production/STRIPE_SECRET_KEY" "STRIPE_SECRET_KEY"
fetch_and_export_param "/ptebydee-server/production/STRIPE_PUBLISHABLE_KEY" "STRIPE_PUBLISHABLE_KEY"
fetch_and_export_param "/ptebydee-server/production/STRIPE_WEBHOOK_SECRET" "STRIPE_WEBHOOK_SECRET"

# --- Set non-sensitive or hardcoded variables ---
export NODE_ENV=production
export PORT=5000
export FRONTEND_URL="https://www.ptebydee.com.au"
export EMAIL_USER="ptebydee@gmail.com"
export JWT_EXPIRES_IN="7D"
export JWT_REFRESH_EXPIRES_IN="7D"
export AWS_REGION="ap-southeast-2"
export AWS_S3_BUCKET_NAME="pte-by-dee"
export AWS_ACCESS_KEY_ID="AKIA57AQRC3KWXLWTXOE"
export AWS_SECRET_ACCESS_KEY="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"

# --- Start the application with PM2 ---
echo "Attempting to start ptebydee-server using ecosystem.config.js with full detachment..."

pm2 stop ptebydee-server || true
pm2 delete ptebydee-server || true

# IMPORTANT CHANGE: Use 'setsid' and 'nohup' and '&' to fully detach PM2 from the script's process.
setsid nohup pm2 start ecosystem.config.js > /dev/null 2>&1 &

sleep 2 # Give PM2 a moment

echo "PM2 commands sent. ApplicationStart hook exiting immediately."
exit 0 # Crucial: Ensure successful exit