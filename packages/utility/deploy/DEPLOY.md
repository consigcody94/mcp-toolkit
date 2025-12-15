# 🚀 Deployment Guide

## Free Hosting Options

### Deploy to Render (Recommended - 100% Free)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/consigcody94/sitefast)

**Features:**
- ✅ Free tier (no credit card required)
- ✅ Automatic HTTPS
- ✅ Auto-deploy from GitHub
- ✅ 750 hours/month free (basically 24/7)

**One-Click Deployment:**

1. Click the "Deploy to Render" button above
2. Connect your GitHub account
3. Select the repository: `consigcody94/sitefast`
4. Render will automatically detect `render.yaml` and configure everything
5. Your app will be live at: `https://sitefast-XXXX.onrender.com`

**Manual Deployment:**

1. Sign up at [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Render auto-detects settings from `render.yaml`
5. Click "Create Web Service"

### Deploy to Railway (Alternative)

Railway offers $5/month free credit:

1. Sign up at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `consigcody94/sitefast`
4. Railway auto-configures from the codebase
5. Your app will be live with a custom domain

### Environment Variables

Required:
- `NODE_ENV`: `production`
- `PORT`: `3000` (auto-set by Render)
- `API_PORT`: `3001`

Optional:
- `BASE_DOMAIN`: Your custom domain (e.g., `sitefast.dev`)
- `DATA_DIR`: `/app/data` (persisted storage)

### Custom Domain

**Render:**
1. Go to your service → Settings
2. Add custom domain
3. Update DNS: CNAME → your-app.onrender.com

**Railway:**
1. Go to your service → Settings → Domains
2. Add custom domain
3. Update DNS as instructed

## Docker Deployment (Self-Hosted)

### Using Docker Compose

```bash
# Clone repository
git clone https://github.com/consigcody94/sitefast.git
cd sitefast

# Start with Docker Compose
docker-compose up -d

# Access at http://localhost:3000
```

### Using Docker

```bash
# Build image
docker build -t sitefast .

# Run container
docker run -d \\
  -p 3000:3000 \\
  -p 3001:3001 \\
  -v $(pwd)/data:/app/data \\
  -e NODE_ENV=production \\
  sitefast

# Access at http://localhost:3000
```

## VPS Deployment (DigitalOcean, Linode, etc.)

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and install
git clone https://github.com/consigcody94/sitefast.git
cd sitefast
npm install
npm run build

# Install PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start npm --name "sitefast" -- start
pm2 save
pm2 startup

# Configure Nginx reverse proxy (optional)
sudo apt install nginx
# ... nginx configuration
```

## Troubleshooting

### Build Failures

```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use

```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Data Persistence

Ensure the `data/` directory is mounted as a volume for persistent storage.

## Live Demo

🌐 **Official Demo**: https://sitefast.onrender.com (coming soon)

Try deploying your own site instantly!
