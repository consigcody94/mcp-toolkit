# 📚 SiteFast Examples

Example projects to test SiteFast deployment capabilities.

## Quick Test Projects

### 1. Static HTML Site

```bash
cd examples/static-site
zip -r static-site.zip .
# Upload to SiteFast at http://localhost:3002
```

**Features:**
- Simple HTML/CSS/JS
- No build process required
- Instant deployment

### 2. React App (Vite)

```bash
cd examples/react-vite-app
zip -r react-app.zip .
# Upload to SiteFast
```

**Features:**
- Modern React with Vite
- Auto-detected framework
- Fast build times

### 3. Next.js App

```bash
cd examples/nextjs-app
zip -r nextjs-app.zip .
# Upload to SiteFast
```

**Features:**
- Next.js 14
- API routes
- Static export

### 4. Vue 3 + Vite

```bash
cd examples/vue-vite-app
zip -r vue-app.zip .
# Upload to SiteFast
```

**Features:**
- Vue 3 with Composition API
- Vite build
- TypeScript support

## Git Deployment Examples

### Deploy from GitHub

```bash
# In SiteFast web dashboard, use:
Repository URL: https://github.com/username/repo.git
Branch: main
```

### Test Repositories

Here are public repositories you can use for testing:

1. **Simple React App**
   - `https://github.com/vercel/next.js.git`
   - Branch: `canary`
   - Directory: `examples/blog-starter`

2. **Vite React Template**
   - `https://github.com/vitejs/vite.git`
   - Branch: `main`
   - Directory: `packages/create-vite/template-react-ts`

3. **Static Site**
   - Any static HTML repository

## Environment Variables Example

When deploying, you can pass environment variables:

```json
{
  "NEXT_PUBLIC_API_URL": "https://api.example.com",
  "NODE_ENV": "production",
  "VITE_APP_TITLE": "My App"
}
```

## Testing Deployments

After deployment, your site will be available at:

```
http://<subdomain>.localhost:3000
```

Example subdomains:
- `my-react-app.localhost:3000`
- `portfolio.localhost:3000`
- `docs.localhost:3000`

## Common Issues

### Build Fails

Check build logs in the SiteFast dashboard:
1. Go to Projects page
2. Click on your project
3. View deployment logs

### Framework Not Detected

Ensure your `package.json` includes the framework dependency:
- Next.js: `"next": "^14.0.0"`
- React: `"react": "^18.0.0"`
- Vue: `"vue": "^3.0.0"`
- Vite: `"vite": "^5.0.0"`

### Port Conflicts

If port 3000 or 3001 is busy, update `.env`:

```bash
PORT=4000
API_PORT=4001
```
