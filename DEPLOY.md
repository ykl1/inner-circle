# Deployment Guide

## Architecture

```
┌─────────────────────────────────────┐
│           AWS EC2 t3.micro          │
│  ┌─────────────┐  ┌──────────────┐  │
│  │   Frontend  │  │   Backend    │  │
│  │   (static)  │  │  Socket.io   │  │
│  └─────────────┴──┴──────────────┘  │
│         Express serves both         │
│           Port 3001                 │
└─────────────────────────────────────┘
        Auto-deploy on git push
```

**Game URL:** `http://YOUR_EC2_IP:3001`

---

## 1. Launch EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. Configure:
   - **Name**: `pick-me-server`
   - **AMI**: Amazon Linux 2023 (free tier)
   - **Instance type**: t3.micro (free tier eligible)
   - **Key pair**: Create or select existing
   - **Security group**: 
     - SSH (22) from your IP
     - Custom TCP (3001) from anywhere (0.0.0.0/0 IPv4 + ::/0 IPv6)
3. Launch and note the public IP

---

## 2. Initial Server Setup

### SSH into your instance:

```bash
chmod 400 your-key.pem  # First time only
ssh -i your-key.pem ec2-user@YOUR_EC2_IP
```

### Install dependencies and deploy:

```bash
# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs git

# Install PM2
sudo npm install -g pm2

# Clone repository
cd ~
git clone https://github.com/YOUR_USERNAME/pick-me.git
cd pick-me

# Build frontend
cd client
npm install
npm run build
cp -r dist ../server/public
cd ..

# Start server
cd server
npm install --production
pm2 start ecosystem.config.cjs --env production
pm2 save

# Auto-start on reboot
pm2 startup
# Run the command it outputs (starts with 'sudo env...')
```

**Your game is now live at:** `http://YOUR_EC2_IP:3001`

---

## 3. Setup Auto-Deploy (GitHub Actions)

Add these secrets to your GitHub repo (Settings → Secrets → Actions):

| Secret | Value |
|--------|-------|
| `EC2_HOST` | Your EC2 public IP (e.g., `3.143.254.122`) |
| `EC2_USERNAME` | `ec2-user` |
| `EC2_SSH_KEY` | Full contents of your `.pem` private key file |

Now every push to `main` auto-deploys both frontend and backend!

---

## Workflow

After setup, your workflow is simply:

```bash
# Make changes locally
git add .
git commit -m "your changes"
git push
```

GitHub Actions will:
1. SSH into EC2
2. Pull latest code
3. Build frontend
4. Copy to server/public
5. Restart server

**Deploy time:** ~60 seconds

---

## Useful Commands

### On EC2

```bash
# View logs
pm2 logs

# Restart server
pm2 restart pick-me-server

# Check status
pm2 status

# Manual deploy (if needed)
cd ~/pick-me
git pull origin main
cd client && npm install && npm run build && cp -r dist ../server/public
cd ../server && npm install --production && pm2 restart pick-me-server
```

### Locally

```bash
# Build and test production version locally
npm run build
npm start
# Visit http://localhost:3001

# Manual deploy to EC2 (without GitHub Actions)
EC2_HOST=YOUR_IP EC2_KEY=~/.ssh/your-key.pem ./deploy.sh
```

---

## Troubleshooting

### Can't access the game
- Check EC2 security group allows port 3001 (both IPv4 and IPv6)
- Check server is running: `pm2 status`
- Check logs: `pm2 logs`

### GitHub Actions failing
- Verify all 3 secrets are set correctly
- `EC2_SSH_KEY` must be the full private key (including `-----BEGIN...` and `-----END...` lines)
- Check Actions tab for error details

### Server crashes after deploy
- SSH in and check logs: `pm2 logs`
- Look for syntax errors or missing dependencies

### Frontend not updating
- Make sure `server/public` contains the latest build
- Try: `pm2 restart pick-me-server`
