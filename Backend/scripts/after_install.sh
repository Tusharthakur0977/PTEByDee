#!/bin/bash
echo "Changing to application directory..."
APP_DIR="/home/ubuntu/ptebydee-server" # Define app directory variable
cd $APP_DIR

echo "Installing npm dependencies..."
npm install --production # Install only production dependencies

echo "Generating Prisma Client..."
npx prisma generate # Generates the Prisma Client based on your schema

# !!! IMPORTANT for MongoDB with Prisma !!!
# If you are using Prisma's schema push for MongoDB (instead of explicit migrations)
# and you need schema changes to be applied on deployment, uncomment the line below.
# Be aware: 'db push' can lead to data loss if not used carefully in production.
# Consider running this manually or in a more controlled way for production databases.
# echo "Pushing Prisma schema to MongoDB (if changes detected)..."
# npx prisma db push --accept-data-loss # --accept-data-loss is needed for non-interactive execution

echo "Dependencies installed and Prisma Client generated."