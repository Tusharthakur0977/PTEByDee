#!/bin/bash

echo "Attempting to stop the application with PM2..."

APP_DIR="/home/ubuntu/ptebydee-server"
APP_NAME="ptebydee-server"
cd "$APP_DIR" || { echo "WARNING: Failed to change to application directory: $APP_DIR. Continuing stop attempt."; }

if ! command -v pm2 &> /dev/null; then
    echo "WARNING: PM2 not found. Cannot stop application via PM2."
else
    if pm2 list | grep -q "$APP_NAME"; then
        echo "Stopping PM2 process: $APP_NAME..."
        pm2 stop "$APP_NAME"
        if [ $? -eq 0 ]; then
            echo "PM2 process $APP_NAME stopped successfully."
        else
            echo "ERROR: Failed to stop PM2 process $APP_NAME. Continuing to delete step."
        fi
    else
        echo "PM2 process $APP_NAME not found or not running. No need to stop."
    fi

    echo "Deleting PM2 process: $APP_NAME..."
    pm2 delete "$APP_NAME"
    if [ $? -eq 0 ]; then
        echo "PM2 process $APP_NAME deleted successfully."
    else
        echo "WARNING: Failed to delete PM2 process $APP_NAME (might not have been running or already deleted)."
    fi

    echo "Saving current PM2 process list..."
    pm2 save
    if [ $? -eq 0 ]; then
        echo "PM2 process list saved."
    else
        echo "WARNING: Failed to save PM2 process list."
    fi
fi

echo "Application stop process completed."