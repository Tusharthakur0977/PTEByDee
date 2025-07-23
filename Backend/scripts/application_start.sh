#!/bin/bash
echo "Starting application with PM2..."
APP_DIR="/home/ubuntu/ptebydee-server"
cd $APP_DIR

# --- Install AWS CLI v2 if not already present (ensure this is idempotent) ---
if ! command -v aws &> /dev/null
then
    echo "AWS CLI v2 not found, installing..."
    sudo apt-get update
    sudo apt-get install -y unzip curl # Ensure unzip and curl are available

    # Download to /tmp, which is always writable
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"

    # Unzip in /tmp and then install
    cd /tmp # Temporarily change to /tmp for unzip and install
    unzip awscliv2.zip
    sudo ./aws/install --update # Install globally

    # Clean up and return to APP_DIR
    rm -rf awscliv2.zip aws
    cd $APP_DIR # <--- CRITICAL: Change back to your APP_DIR!

    echo "AWS CLI v2 installed."
else
    echo "AWS CLI v2 already installed."
fi

# --- Fetch Environment Variables from AWS Systems Manager Parameter Store ---
# IMPORTANT: Use YOUR_AWS_REGION (ap-southeast-2 for Sydney) for --region
# Replace parameter names with the exact names you used when creating them.

echo "Fetching DATABASE_URL from Parameter Store..."
export DATABASE_URL=$(aws ssm get-parameter --name "/ptebydee-server/production/DATABASE_URL" --with-decryption --query Parameter.Value --output text --region ap-southeast-2)
echo "DATABASE_URL fetched (value hidden in logs for security)."

echo "Fetching EMAIL_APP_PASSWORD from Parameter Store..."
export EMAIL_APP_PASSWORD=$(aws ssm get-parameter --name "/ptebydee-server/production/EMAIL_APP_PASSWORD" --with-decryption --query Parameter.Value --output text --region ap-southeast-2)

echo "Fetching GOOGLE_CLIENT_ID from Parameter Store..."
export GOOGLE_CLIENT_ID=$(aws ssm get-parameter --name "/ptebydee-server/production/GOOGLE_CLIENT_ID" --with-decryption --query Parameter.Value --output text --region ap-southeast-2)

echo "Fetching GOOGLE_CLIENT_SECRET from Parameter Store..."
export GOOGLE_CLIENT_SECRET=$(aws ssm get-parameter --name "/ptebydee-server/production/GOOGLE_CLIENT_SECRET" --with-decryption --query Parameter.Value --output text --region ap-southeast-2)

echo "Fetching JWT_REFRESH_SECRET from Parameter Store..."
export JWT_REFRESH_SECRET=$(aws ssm get-parameter --name "/ptebydee-server/production/JWT_REFRESH_SECRET" --with-decryption --query Parameter.Value --output text --region ap-southeast-2)

echo "Fetching JWT_SECRET from Parameter Store..."
export JWT_SECRET=$(aws ssm get-parameter --name "/ptebydee-server/production/JWT_SECRET" --with-decryption --query Parameter.Value --output text --region ap-southeast-2)

echo "Fetching AWS_ACCESS_KEY_ID from Parameter Store..."
export AWS_ACCESS_KEY_ID=$(aws ssm get-parameter --name "/ptebydee-server/production/AWS_ACCESS_KEY_ID" --with-decryption --query Parameter.Value --output text --region ap-southeast-2)

echo "Fetching AWS_SECRET_ACCESS_KEY from Parameter Store..."
export AWS_SECRET_ACCESS_KEY=$(aws ssm get-parameter --name "/ptebydee-server/production/AWS_SECRET_ACCESS_KEY" --with-decryption --query Parameter.Value --output text --region ap-southeast-2)

echo "Fetching AWS_S3_BUCKET_NAME from Parameter Store..."
export AWS_S3_BUCKET_NAME=$(aws ssm get-parameter --name "/ptebydee-server/production/AWS_S3_BUCKET_NAME" --with-decryption --query Parameter.Value --output text --region ap-southeast-2)

# --- Set non-sensitive or hardcoded variables ---
# These variables do not contain sensitive data, so they can be set directly.
export NODE_ENV=production
export PORT=5000 # Make sure this matches the port your app truly listens on
export FRONTEND_URL="https://pte-by-dee.vercel.app/" # <--- IMPORTANT: Update this to your actual frontend URL if applicable
export EMAIL_USER="ptebydee@gmail.com"
export JWT_EXPIRES_IN="7D"
export JWT_REFRESH_EXPIRES_IN="7D"
export AWS_REGION="ap-southeast-2" # AWS region for S3 bucket

# --- Start the application with PM2 ---
# Assuming your main entry file is index.js as per your typical Node.js setup
# The 'export' commands above make these variables available to this 'pm2 start' command.
pm2 start index.js --name "ptebydee-server" --
# If you still have a simplified ecosystem.config.js (without sensitive env vars)
# and want to use it for PM2 config (instances, exec_mode):
pm2 start ecosystem.config.js --name "ptebydee-server"
# Note: If using --env production with ecosystem.config.js, and that file has env_production block,
# the exported vars from the script will override those in ecosystem.config.js if names conflict.

pm2 save # Save PM2 process list to persist across reboots
echo "Application started."