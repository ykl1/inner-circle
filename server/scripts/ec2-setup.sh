#!/bin/bash
# EC2 Initial Setup Script
# Run this once on a fresh EC2 instance (Amazon Linux 2023 or Ubuntu)

set -e

echo "=== Installing Node.js ==="
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - 2>/dev/null || \
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo yum install -y nodejs 2>/dev/null || sudo apt-get install -y nodejs

echo "=== Installing PM2 ==="
sudo npm install -g pm2

echo "=== Installing Git ==="
sudo yum install -y git 2>/dev/null || sudo apt-get install -y git

echo "=== Cloning Repository ==="
cd ~
git clone https://github.com/YOUR_USERNAME/inner-circle.git
cd inner-circle/server
npm install --production

echo "=== Starting Server with PM2 ==="
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup

echo ""
echo "=== Setup Complete ==="
echo "Server is running on port 3001"
echo ""
echo "Don't forget to:"
echo "1. Update the git remote URL if needed"
echo "2. Open port 3001 in your EC2 security group"
echo "3. Set up GitHub secrets for CI/CD"
