#!/bin/bash

echo "Starting AfterInstall hook..."

APP_DIR="/home/ubuntu/ptebydee-server"
cd "$APP_DIR" || { echo "ERROR: Failed to change to application directory: $APP_DIR"; exit 1; }

echo "Verifying Node.js and npm versions..."
node -v || { echo "ERROR: Node.js is not found or not in PATH. This should have been handled by BeforeInstall hook."; exit 1; }
npm -v || { echo "ERROR: npm is not found or not in PATH. This should have been handled by BeforeInstall hook."; exit 1; }
echo "Node.js $(node -v) and npm $(npm -v) confirmed."

echo "Installing npm dependencies in production mode..."
npm ci --production || { echo "ERROR: Failed to install npm dependencies."; exit 1; }
echo "npm dependencies installed."

echo "Generating Prisma Client based on schema..."
npx prisma generate || { echo "ERROR: Failed to generate Prisma Client. Check your prisma schema and dependencies."; exit 1; }
echo "Prisma Client generated."

echo "AfterInstall hook completed successfully."