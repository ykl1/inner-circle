# Deployment Guide

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│     Vercel      │  WS     │   AWS EC2       │
│   (Frontend)    │◄───────►│   (Backend)     │
│   React/Vite    │         │   Socket.io     │
└─────────────────┘         └─────────────────┘
     Auto-deploy              Auto-deploy
     on git push              on git push
```

---

## 1. Frontend Deployment (Vercel)

### Initial Setup

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Import your `inner-circle` repository
4. Configure:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
5. Add Environment Variable:
   - **Name**: `VITE_SOCKET_URL`
   - **Value**: `http://YOUR_EC2_IP:3001` (update after EC2 setup)
6. Click "Deploy"

### Updating Frontend

Just push to `main` — Vercel auto-deploys in ~30 seconds.

---

## 2. Backend Deployment (AWS EC2)

### A. Launch EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. Configure:
   - **Name**: `inner-circle-server`
   - **AMI**: Amazon Linux 2023 (free tier)
   - **Instance type**: t3.micro (free tier eligible)
   - **Key pair**: Create or select existing
   - **Security group**: Create with rules:
     - SSH (22) from your IP
     - Custom TCP (3001) from anywhere (0.0.0.0/0)
3. Launch and note the public IP

### B. Initial Server Setup

SSH into your instance:

```bash
ssh -i your-key.pem ec2-user@YOUR_EC2_IP
```

Run the setup script:

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/inner-circle/main/server/scripts/ec2-setup.sh | bash
```

Or manually:

```bash
# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs git

# Install PM2
sudo npm install -g pm2

# Clone and start
cd ~
git clone https://github.com/YOUR_USERNAME/inner-circle.git
cd inner-circle/server
npm install --production
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup  # Follow the printed command
```

### C. Setup GitHub Actions (Auto-Deploy)

Add these secrets to your GitHub repo (Settings → Secrets → Actions):

| Secret | Value |
|--------|-------|
| `EC2_HOST` | Your EC2 public IP (e.g., `54.123.45.67`) |
| `EC2_USERNAME` | `ec2-user` (Amazon Linux) or `ubuntu` (Ubuntu) |
| `EC2_SSH_KEY` | Contents of your `.pem` private key file |

Now every push to `main` that changes `server/` auto-deploys!

---

## 3. Connect Frontend to Backend

After EC2 is running, update Vercel environment variable:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `VITE_SOCKET_URL` to `http://YOUR_EC2_IP:3001`
3. Redeploy (or push a commit)

---

## Workflow

After setup, your workflow is simply:

```bash
# Make changes locally
git add .
git commit -m "your changes"
git push
```

- Frontend changes → Vercel auto-deploys (~30s)
- Backend changes → GitHub Actions deploys to EC2 (~30s)

---

## Useful Commands

### On EC2

```bash
# View logs
pm2 logs

# Restart server
pm2 restart inner-circle-server

# Check status
pm2 status

# Manual pull and restart
cd ~/inner-circle/server && git pull && pm2 restart inner-circle-server
```

### Locally

```bash
# Manual deploy (if GitHub Actions not set up)
./deploy.sh
```

---

## Troubleshooting

### Can't connect to server from frontend
- Check EC2 security group allows port 3001
- Check `VITE_SOCKET_URL` is correct in Vercel
- Check server is running: `pm2 status`

### GitHub Actions failing
- Verify all 3 secrets are set correctly
- Check EC2_SSH_KEY is the full private key (including BEGIN/END lines)

### Server crashes after deploy
- Check logs: `pm2 logs`
- Check for syntax errors in recent changes
