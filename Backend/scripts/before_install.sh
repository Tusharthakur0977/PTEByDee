#!/bin/bash

echo "Starting BeforeInstall hook - Environment Setup (optimized)..."

APP_DIR="/home/ubuntu/ptebydee-server"

# --- Update and Install Essential System Packages & Node.js (NodeSource) ---
echo "Updating apt package list and installing essential packages & Node.js..."
sudo apt-get update -y || { echo "ERROR: Failed to update apt package list."; exit 1; }
sudo apt-get install -y ca-certificates curl gnupg unzip build-essential git || { echo "ERROR: Failed to install essential packages."; exit 1; }

# --- Node.js Installation via NodeSource (Faster & More Reliable for CI/CD) ---
NODE_VERSION="20.x" # Adjust if you need a different LTS version

if command -v node &> /dev/null && node -v | grep -q "^v${NODE_VERSION%.x}"; then
    echo "Node.js v${NODE_VERSION} already installed. Skipping NodeSource setup."
else
    echo "Installing Node.js v${NODE_VERSION} via NodeSource..."
    sudo mkdir -p /etc/apt/keyrings || { echo "ERROR: Failed to create keyrings directory."; exit 1; }
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg || { echo "ERROR: Failed to add NodeSource GPG key."; exit 1; }
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_VERSION nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list || { echo "ERROR: Failed to add NodeSource repository."; exit 1; }
    sudo apt-get update -y || { echo "ERROR: apt-get update failed after adding NodeSource repo."; exit 1; }
    sudo apt-get install -y nodejs || { echo "ERROR: Failed to install nodejs."; exit 1; }
    echo "Node.js installation complete."
fi
node -v || { echo "ERROR: Node.js is not found or not in PATH after installation."; exit 1; }
npm -v || { echo "ERROR: npm is not found or not in PATH after installation."; exit 1; }
echo "Node.js $(node -v) and npm $(npm -v) confirmed."


# --- Install PM2 globally if not present (now relies on system-wide npm) ---
if ! command -v pm2 &> /dev/null; then
    echo "PM2 not found, installing globally..."
    sudo npm install pm2 -g || { echo "ERROR: Failed to install PM2 globally."; exit 1; }
    echo "PM2 installed."
else
    echo "PM2 already installed."
fi


# --- Install AWS CLI v2 if not already present (now relies on global curl/unzip) ---
if ! command -v aws &> /dev/null; then
    echo "AWS CLI v2 not found, installing..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip" || { echo "ERROR: Failed to download AWS CLI v2."; exit 1; }
    (cd /tmp && unzip -o awscliv2.zip && sudo ./aws/install --update) || { echo "ERROR: Failed to unzip or install AWS CLI v2."; exit 1; }
    rm -rf /tmp/awscliv2.zip /tmp/aws
    echo "AWS CLI v2 installed."
else
    echo "AWS CLI v2 already installed."
fi


# --- Clean up previous application installation (recommended for clean deployments) ---
echo "Cleaning up previous application files in $APP_DIR..."

# Check if the directory exists. If not, create it.
if [ ! -d "$APP_DIR" ]; then
    echo "Application directory $APP_DIR does not exist. Creating it."
    sudo mkdir -p "$APP_DIR" || { echo "ERROR: Failed to create application directory: $APP_DIR"; exit 1; }
    # Set ownership immediately after creation
    sudo chown -R ubuntu:ubuntu "$APP_DIR" || { echo "ERROR: Failed to set ownership for $APP_DIR after creation."; exit 1; }
else
    # If the directory exists, clear its contents completely.
    # The ":?" is a bash safety feature. If APP_DIR is unset or empty, it exits,
    # preventing accidental deletion of the root directory.
    echo "Removing all contents (including hidden files) from $APP_DIR..."
    sudo rm -rf "${APP_DIR:?}"/.??* "${APP_DIR:?}"/* || { echo "ERROR: Failed to clean $APP_DIR."; exit 1; }
    # The .??* glob matches files starting with a dot, followed by at least two characters
    # (e.g., .env, .git, but not . or .. which are special directories).
    echo "Cleanup complete."
fi

# Re-confirm ownership after cleanup, in case new directories were made by root during cleanup
echo "Ensuring ownership of $APP_DIR is ubuntu:ubuntu..."
sudo chown -R ubuntu:ubuntu "$APP_DIR" || { echo "ERROR: Failed to set ownership for $APP_DIR."; exit 1; }

echo "BeforeInstall hook completed successfully."