# ⚡ SiteFast

> Deploy websites in seconds - Like Netlify, but fully self-hosted and local

<div align="center">

**Lightning-fast local deployment platform with automatic framework detection**

[![CI/CD](https://github.com/consigcody94/sitefast/actions/workflows/ci.yml/badge.svg)](https://github.com/consigcody94/sitefast/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61dafb.svg)](https://react.dev/)
[![Node](https://img.shields.io/badge/Node-16+-green.svg)](https://nodejs.org/)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/consigcody94/sitefast)

[Features](#features) • [Quick Start](#quick-start) • [Deploy Guide](./DEPLOY.md) • [Docker](#-docker-deployment) • [API Reference](#api-reference) • [Examples](./examples)

</div>

---

## 🎯 What is SiteFast?

SiteFast is a **self-hosted deployment platform** that lets you deploy static sites and web applications locally or on your own infrastructure. Upload a zip file or connect a Git repository, and SiteFast automatically detects your framework, builds your project, and serves it on a subdomain.

### Why SiteFast?

- **⚡ Lightning Fast** - Deploy in seconds, not minutes
- **🎨 Zero Configuration** - Automatically detects Next.js, React, Vue, Vite, and more
- **🔒 Fully Self-Hosted** - Your code, your infrastructure, complete control
- **🌐 Subdomain Routing** - Each deployment gets its own subdomain (e.g., `myapp.localhost`)
- **📦 Multiple Sources** - Deploy from uploaded files OR Git repositories
- **🔄 Easy Redeployments** - One-click redeployment for Git-connected projects
- **📊 Real-time Build Logs** - Watch your deployment build in real-time

## ✨ Features

### Automatic Framework Detection

SiteFast automatically detects and builds:

- ⚡ **Next.js** - Full support for `next build`
- ⚛️ **React** - Create React App and custom React setups
- 🎨 **Vite** - React, Vue, Svelte with Vite
- 💚 **Vue** - Vue CLI and custom Vue projects
- 🔥 **Svelte** - SvelteKit and Svelte apps
- 🅰️ **Angular** - Full Angular CLI support
- 🚀 **Gatsby** - Static site generation
- 📝 **Hugo** - Static site generator
- 📚 **Jekyll** - Ruby-based static sites
- 📄 **Static HTML** - Plain HTML/CSS/JS sites

### Smart Build System

- **Package Manager Detection** - Auto-detects npm, yarn, or pnpm
- **Environment Variables** - Pass custom env vars for builds
- **Build Caching** - Fast subsequent builds
- **Detailed Logging** - Every build step logged

### Reverse Proxy

- **Subdomain Routing** - Automatic subdomain-based routing
- **SPA Support** - Fallback to `index.html` for single-page apps
- **Static Asset Serving** - Optimized static file serving
- **Custom Landing Page** - Beautiful landing page on root domain

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Git (for Git-based deployments)

**Or use Docker** (see [Docker Deployment](#-docker-deployment) section)

### Installation

```bash
# Clone the repository
git clone https://github.com/consigcody94/sitefast.git
cd sitefast

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Build the server
npm run build
```

### Start SiteFast

**Option 1: Backend Only (API + Proxy)**

```bash
npm start
```

This starts two servers:

- **API Server**: `http://localhost:3001` - REST API for deployments
- **Proxy Server**: `http://localhost:3000` - Serves deployed sites

**Option 2: Full Stack (Backend + Web Dashboard)**

```bash
npm run dev
```

This starts three servers:

- **API Server**: `http://localhost:3001` - REST API for deployments
- **Proxy Server**: `http://localhost:3000` - Serves deployed sites
- **Web Dashboard**: `http://localhost:3002` - Beautiful drag-and-drop UI

## 🎨 Web Dashboard

SiteFast includes a beautiful web dashboard with drag-and-drop functionality!

### Features

- **🎯 Drag & Drop Upload** - Drop zip/tar files directly into your browser
- **🌿 Git Deployment Form** - Deploy from any Git repository with a simple form
- **📊 Real-time Stats** - Monitor deployments, failures, and server uptime
- **🗂️ Project Management** - View, manage, and redeploy your projects
- **♻️ One-click Redeploy** - Redeploy Git-connected projects instantly
- **📱 Responsive Design** - Works beautifully on desktop, tablet, and mobile

### Using the Web Dashboard

1. Start SiteFast in development mode: `npm run dev`
2. Open `http://localhost:3002` in your browser
3. **Upload Method**: Enter project name and subdomain, then drag and drop your zip file
4. **Git Method**: Fill out the form with your repository URL and branch
5. Watch your deployment build in real-time!

The web dashboard provides a much friendlier experience than using curl commands, with instant visual feedback and beautiful UI.

## 🐳 Docker Deployment

Run SiteFast with Docker for easy deployment:

```bash
# Using Docker Compose (recommended)
docker-compose up -d

# Or build and run manually
docker build -t sitefast .
docker run -d \
  -p 3000:3000 \
  -p 3001:3001 \
  -v $(pwd)/data:/app/data \
  --name sitefast \
  sitefast
```

Access:
- **API**: `http://localhost:3001`
- **Proxy**: `http://localhost:3000`

For SSL support:

```bash
docker-compose --profile with-ssl up -d
```

## 📖 Usage

### Deploy from Uploaded File

Upload a zip/tar file containing your project:

```bash
curl -X POST http://localhost:3001/api/deploy/upload \
  -F "file=@myproject.zip" \
  -F "projectName=My Project" \
  -F "subdomain=myproject"
```

Your site will be available at: `http://myproject.localhost:3000`

### Deploy from Git Repository

Deploy directly from a Git repository:

```bash
curl -X POST http://localhost:3001/api/deploy/git \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "My React App",
    "subdomain": "react-app",
    "repositoryUrl": "https://github.com/username/react-app.git",
    "branch": "main"
  }'
```

Your site will be available at: `http://react-app.localhost:3000`

### Redeploy

For Git-connected projects, redeploy with latest changes:

```bash
curl -X POST http://localhost:3001/api/projects/{projectId}/redeploy
```

## 📡 API Reference

### Projects

#### `GET /api/projects`
List all projects

#### `GET /api/projects/:id`
Get specific project details

#### `DELETE /api/projects/:subdomain`
Delete a project and all its deployments

### Deployments

#### `POST /api/deploy/upload`
Deploy from uploaded file (zip/tar)

**Form Data:**
- `file` - The project file (zip/tar)
- `projectName` - Display name for the project
- `subdomain` - Subdomain for the deployment
- `environmentVariables` - JSON string of env vars (optional)

#### `POST /api/deploy/git`
Deploy from Git repository

**JSON Body:**
```json
{
  "projectName": "My Project",
  "subdomain": "myproject",
  "repositoryUrl": "https://github.com/user/repo.git",
  "branch": "main",
  "environmentVariables": {
    "NEXT_PUBLIC_API_URL": "https://api.example.com"
  }
}
```

#### `POST /api/projects/:id/redeploy`
Redeploy an existing Git-connected project

#### `GET /api/projects/:id/deployments`
Get all deployments for a project

#### `GET /api/deployments/:id`
Get deployment details

#### `GET /api/deployments/:id/logs`
Get build logs for a deployment

### System

#### `GET /api/stats`
Get system statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "totalProjects": 5,
    "totalDeployments": 12,
    "activeDeployments": 4,
    "failedDeployments": 1,
    "uptime": 3600.5
  }
}
```

#### `GET /health`
Health check endpoint

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Server Ports
PORT=3000           # Proxy server port
API_PORT=3001       # API server port
HOST=localhost

# Domain Configuration
BASE_DOMAIN=localhost

# Data Directory
DATA_DIR=./data
```

### Subdomain Configuration

For subdomain routing to work on `localhost`, no additional configuration is needed. Modern browsers handle `*.localhost` automatically.

For production deployments with a real domain:

1. Set `BASE_DOMAIN` to your domain (e.g., `example.com`)
2. Configure DNS wildcard record: `*.example.com → your-server-ip`
3. Deployments will be accessible at `subdomain.example.com`

## 🏗️ Project Structure

```
sitefast/
├── packages/
│   ├── server/          # Deployment server (Backend)
│   │   ├── src/
│   │   │   ├── build-engine.ts        # Build system
│   │   │   ├── database.ts            # SQLite database
│   │   │   ├── deployment-manager.ts  # Deployment orchestration
│   │   │   ├── framework-detector.ts  # Framework auto-detection
│   │   │   ├── index.ts               # Main server
│   │   │   ├── proxy.ts               # Reverse proxy
│   │   │   ├── routes.ts              # API routes
│   │   │   └── types.ts               # TypeScript types
│   │   └── package.json
│   └── web/             # Web Dashboard (Frontend)
│       ├── src/
│       │   ├── api/
│       │   │   └── client.ts          # API client
│       │   ├── components/
│       │   │   ├── GitDeployForm.tsx  # Git deployment form
│       │   │   ├── Layout.tsx         # App layout
│       │   │   ├── ProjectCard.tsx    # Project card component
│       │   │   ├── ProjectList.tsx    # Projects list
│       │   │   ├── Stats.tsx          # Statistics dashboard
│       │   │   └── UploadZone.tsx     # Drag & drop upload
│       │   ├── pages/
│       │   │   ├── Dashboard.tsx      # Main dashboard
│       │   │   └── Projects.tsx       # Projects page
│       │   ├── App.tsx                # Main app
│       │   ├── main.tsx               # Entry point
│       │   └── types.ts               # TypeScript types
│       └── package.json
├── data/                # Created on first run
│   ├── deployments/     # Deployed sites
│   ├── builds/          # Temporary build directories
│   └── sitefast.db      # SQLite database
├── .env                 # Configuration
└── package.json
```

## 🎨 How It Works

1. **Upload or Connect** - Upload a zip file or provide a Git repository URL
2. **Auto-Detect** - SiteFast analyzes `package.json` and project files to detect the framework
3. **Install** - Runs `npm install` (or yarn/pnpm) to install dependencies
4. **Build** - Executes the appropriate build command for your framework
5. **Deploy** - Copies build output to the deployments directory
6. **Serve** - Reverse proxy routes subdomain requests to your deployed site

## 🔍 Supported Frameworks

| Framework | Detection | Build Command | Output Dir |
|-----------|-----------|---------------|------------|
| Next.js | `next` dependency | `next build` | `.next` |
| React (CRA) | `react-scripts` | `react-scripts build` | `build` |
| Vue | `@vue/cli-service` | `vue-cli-service build` | `dist` |
| Vite | `vite` dependency | `vite build` | `dist` |
| Svelte | `svelte` dependency | Custom or `rollup -c` | `public/build` |
| Angular | `@angular/core` | `ng build --configuration production` | `dist` |
| Gatsby | `gatsby` dependency | `gatsby build` | `public` |
| Hugo | `config.toml` or `config.yaml` | `hugo` | `public` |
| Jekyll | `_config.yml` | `jekyll build` | `_site` |
| Static | No framework detected | None | `.` (root) |

## 🛠️ Development

### Run in Development Mode

```bash
# Start both server and web dashboard with auto-reload
npm run dev

# Or start individually:
npm run dev:server  # API + Proxy server only
npm run dev:web     # Web dashboard only
```

### Build from Source

```bash
# Build everything
npm run build

# Or build individually:
npm run build --workspace=@sitefast/server
npm run build --workspace=@sitefast/web
```

### Type Checking

```bash
npm run typecheck --workspace=@sitefast/server
npm run typecheck --workspace=@sitefast/web
```

## 📊 Database

SiteFast uses SQLite for simplicity and portability. The database stores:

- **Projects** - Project metadata, settings, framework info
- **Deployments** - Deployment history, status, build logs

Database location: `data/sitefast.db`

## 🔐 Security Considerations

- **Local Only** - By default, SiteFast binds to `localhost` for security
- **No Authentication** - Currently no built-in auth (suitable for local development)
- **Production Use** - For production, add:
  - Reverse proxy with SSL (nginx, Caddy)
  - Authentication layer
  - Firewall rules
  - Regular backups

## 🚧 Roadmap

- [x] Web dashboard UI with drag-and-drop
- [x] Project management interface
- [x] Real-time statistics dashboard
- [ ] Real-time deployment logs via WebSocket
- [ ] SSL certificate generation (Let's Encrypt)
- [ ] Custom build commands
- [ ] Deployment rollbacks
- [ ] Environment variable management UI
- [ ] Deployment previews for branches
- [ ] Docker support
- [ ] Build caching
- [ ] Multi-user support with authentication

## 📚 Examples

Check out the [`examples/`](./examples) directory for ready-to-deploy sample projects:

- **Static Site** - Simple HTML/CSS/JS
- **React + Vite** - Modern React app
- **Next.js** - Full Next.js application
- **Vue 3** - Vue with Vite

Test deployments:

```bash
cd examples/static-site
zip -r ../static-site.zip .
# Upload at http://localhost:3002
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

Quick steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and type checking
5. Commit (`git commit -m 'feat: add amazing feature'`)
6. Push (`git push origin feature/amazing-feature`)
7. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

- Inspired by Netlify and Vercel's deployment simplicity
- Coolify for self-hosted deployment concepts
- Express.js for the web framework
- SQLite for the embedded database

---

**Built with ❤️ for developers who want control over their deployments**

Deploy locally, deploy fast! ⚡

