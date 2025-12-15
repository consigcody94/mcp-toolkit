# 🎨 SiteFast Web Dashboard

Beautiful web interface for SiteFast with drag-and-drop deployment functionality.

## Features

- **Drag & Drop Upload** - Drop zip/tar files directly into the browser
- **Git Deployment** - Deploy from GitHub, GitLab, or any Git repository
- **Real-time Stats** - Monitor active deployments and system status
- **Project Management** - View, manage, and redeploy your projects
- **One-click Redeploy** - Redeploy Git-connected projects instantly
- **Responsive Design** - Beautiful UI that works on all devices

## Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Full type safety
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **React Dropzone** - Drag & drop file uploads
- **Lucide React** - Beautiful icons
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls

## Development

```bash
# Install dependencies
npm install

# Start dev server (runs on port 3002)
npm run dev

# Build for production
npm run build

# Type check
npm run typecheck

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── api/
│   └── client.ts           # API client for backend communication
├── components/
│   ├── GitDeployForm.tsx   # Git repository deployment form
│   ├── Layout.tsx          # App layout with navigation
│   ├── ProjectCard.tsx     # Individual project card
│   ├── ProjectList.tsx     # List of all projects
│   ├── Stats.tsx           # System statistics dashboard
│   └── UploadZone.tsx      # Drag & drop file upload zone
├── pages/
│   ├── Dashboard.tsx       # Main dashboard page
│   └── Projects.tsx        # Projects page
├── types.ts                # TypeScript interfaces
├── App.tsx                 # Main app component
├── main.tsx                # Entry point
└── index.css               # Global styles with Tailwind
```

## Environment

The dev server proxies API requests to the backend:

- **Frontend**: `http://localhost:3002`
- **Backend API**: `http://localhost:3001`
- **Proxy**: `/api` requests are forwarded to backend

## Features in Detail

### Drag & Drop Upload

- Drop `.zip`, `.tar`, or `.tar.gz` files
- Auto-generates project name and subdomain from filename
- Real-time upload progress
- Instant feedback on success/failure

### Git Deployment

- Deploy from any Git repository URL
- Specify branch (defaults to `main`)
- One-click redeployments for Git projects
- Commit info tracking

### Project Management

- View all deployed projects
- See framework detection results
- Open deployed sites in new tab
- Delete projects with confirmation
- Redeploy Git projects instantly

### Real-time Stats

- Total projects count
- Active deployments
- Failed deployments
- Server uptime

## API Integration

The web dashboard communicates with the SiteFast API server:

```typescript
// Example: Deploy from upload
await apiClient.deployFromUpload(file, 'My Project', 'my-project');

// Example: Deploy from Git
await apiClient.deployFromGit(
  'My React App',
  'react-app',
  'https://github.com/username/repo.git',
  'main'
);

// Example: Redeploy
await apiClient.redeploy(projectId);
```

## Deployment

Build the production bundle:

```bash
npm run build
```

Output will be in `dist/` directory. Serve with any static file server or integrate with the SiteFast proxy server.

## License

MIT
