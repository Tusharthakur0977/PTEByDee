#!/bin/bash
# Stop the application if it's already running
echo "Stopping application..."
pm2 stop my-nodejs-app || true
pm2 delete my-nodejs-app || true # Ensure it's not in PM2 list
echo "Stopped application."