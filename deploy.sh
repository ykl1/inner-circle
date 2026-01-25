#!/bin/bash
# Manual deploy script (alternative to GitHub Actions)
# Usage: ./deploy.sh

set -e

EC2_HOST="${EC2_HOST:-your-ec2-ip}"
EC2_USER="${EC2_USER:-ec2-user}"
EC2_KEY="${EC2_KEY:-~/.ssh/your-key.pem}"

echo "=== Deploying to EC2 ==="
ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" << 'EOF'
  cd ~/inner-circle
  git pull origin main
  
  # Build frontend
  cd client
  npm install
  npm run build
  rm -rf ../server/public
  cp -r dist ../server/public
  
  # Restart server
  cd ../server
  npm install --production
  pm2 restart inner-circle-server
EOF

echo "=== Deploy Complete ==="
echo "Game available at: http://$EC2_HOST:3001"
