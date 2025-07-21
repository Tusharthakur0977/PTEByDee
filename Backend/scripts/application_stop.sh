#!/bin/bash
echo "Stopping application..."
pm2 stop my-nodejs-app || true # Use '|| true' to prevent script failure if app isn't running
echo "Application stopped."