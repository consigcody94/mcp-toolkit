/**
 * Reverse proxy server for serving deployed sites
 * Routes requests to deployed static files based on subdomain
 */

import express from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import { DatabaseService } from './database.js';

export function createProxyServer(
  db: DatabaseService,
  deploymentsDir: string,
  baseDomain: string,
  port: number
): void {
  const app = express();

  // Serve deployed sites
  app.use((req, res, next) => {
    const host = req.headers.host || '';
    const subdomain = extractSubdomain(host, baseDomain);

    if (!subdomain || subdomain === baseDomain) {
      // Root domain - serve landing page
      return res.send(getLandingPage());
    }

    // Find project by subdomain
    const project = db.getProjectBySubdomain(subdomain);

    if (!project) {
      return res.status(404).send(getNotFoundPage(subdomain));
    }

    // Check if deployment exists
    const latestDeployment = db.getLatestDeployment(project.id);

    if (!latestDeployment || latestDeployment.status !== 'ready') {
      return res.status(503).send(getBuildingPage(subdomain));
    }

    // Serve static files
    const deploymentPath = join(deploymentsDir, subdomain);

    if (!existsSync(deploymentPath)) {
      return res.status(404).send(getNotFoundPage(subdomain));
    }

    // Use express.static with fallback to index.html for SPAs
    const staticMiddleware = express.static(deploymentPath, {
      extensions: ['html', 'htm'],
      index: ['index.html', 'index.htm'],
    });

    staticMiddleware(req, res, (err) => {
      if (err) {
        return next(err);
      }

      // SPA fallback - serve index.html for non-asset routes
      if (!req.path.includes('.')) {
        const indexPath = join(deploymentPath, 'index.html');

        if (existsSync(indexPath)) {
          return res.sendFile(indexPath);
        }
      }

      res.status(404).send(getNotFoundPage(subdomain));
    });
  });

  app.listen(port, () => {
    console.log(`⚡ SiteFast Proxy Server`);
    console.log(`   Proxy: http://${baseDomain}:${port}`);
    console.log(`   Sites: http://<subdomain>.${baseDomain}:${port}\n`);
  });
}

/**
 * Extract subdomain from hostname
 */
function extractSubdomain(host: string, baseDomain: string): string | null {
  // Remove port if present
  const hostname = host.split(':')[0];

  // Check if it matches our base domain
  if (!hostname.endsWith(baseDomain)) {
    return null;
  }

  // Extract subdomain
  const subdomain = hostname.replace(`.${baseDomain}`, '');

  return subdomain === hostname ? baseDomain : subdomain;
}

/**
 * Landing page for root domain
 */
function getLandingPage(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SiteFast ⚡</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      text-align: center;
      max-width: 600px;
    }

    h1 {
      font-size: 72px;
      font-weight: 900;
      margin-bottom: 20px;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }

    .tagline {
      font-size: 24px;
      opacity: 0.9;
      margin-bottom: 40px;
    }

    .features {
      display: grid;
      gap: 20px;
      margin-top: 40px;
      text-align: left;
    }

    .feature {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      padding: 20px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .feature h3 {
      font-size: 20px;
      margin-bottom: 8px;
    }

    .feature p {
      opacity: 0.8;
      line-height: 1.6;
    }

    .cta {
      margin-top: 40px;
    }

    .cta a {
      display: inline-block;
      background: white;
      color: #667eea;
      padding: 16px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 18px;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .cta a:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚡ SiteFast</h1>
    <p class="tagline">Deploy websites in seconds - Like Netlify, but fully self-hosted</p>

    <div class="features">
      <div class="feature">
        <h3>🚀 Lightning Fast</h3>
        <p>Drag & drop your site or connect a Git repo. Deploy in seconds, not minutes.</p>
      </div>

      <div class="feature">
        <h3>🎯 Auto-Detect Frameworks</h3>
        <p>Automatically detects Next.js, React, Vue, Vite, Gatsby, and more.</p>
      </div>

      <div class="feature">
        <h3>🔒 Fully Self-Hosted</h3>
        <p>Run it locally or on your own server. Your code, your infrastructure.</p>
      </div>
    </div>

    <div class="cta">
      <a href="http://localhost:3001/api/stats">View API</a>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * 404 page for non-existent deployments
 */
function getNotFoundPage(subdomain: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - Site Not Found</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #1a1a1a;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      text-align: center;
      max-width: 500px;
    }

    h1 {
      font-size: 120px;
      font-weight: 900;
      margin-bottom: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    h2 {
      font-size: 24px;
      margin-bottom: 16px;
    }

    p {
      opacity: 0.7;
      line-height: 1.6;
      margin-bottom: 32px;
    }

    code {
      background: rgba(255, 255, 255, 0.1);
      padding: 4px 8px;
      border-radius: 4px;
      font-family: 'Monaco', 'Courier New', monospace;
    }

    a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }

    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>404</h1>
    <h2>Site Not Found</h2>
    <p>
      The site <code>${subdomain}</code> does not exist or hasn't been deployed yet.
    </p>
    <p>
      <a href="http://localhost:3001/api/projects">View all projects</a>
    </p>
  </div>
</body>
</html>
  `;
}

/**
 * Building page for deployments in progress
 */
function getBuildingPage(subdomain: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Building...</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      text-align: center;
      max-width: 500px;
    }

    .spinner {
      width: 60px;
      height: 60px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 30px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    h1 {
      font-size: 48px;
      font-weight: 900;
      margin-bottom: 16px;
    }

    p {
      opacity: 0.9;
      line-height: 1.6;
      font-size: 18px;
    }

    code {
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 8px;
      border-radius: 4px;
      font-family: 'Monaco', 'Courier New', monospace;
    }
  </style>
  <script>
    // Auto-refresh every 5 seconds
    setTimeout(() => {
      window.location.reload();
    }, 5000);
  </script>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h1>⚡ Building...</h1>
    <p>
      Your site <code>${subdomain}</code> is being deployed.
    </p>
    <p style="margin-top: 20px; font-size: 14px; opacity: 0.7;">
      This page will refresh automatically.
    </p>
  </div>
</body>
</html>
  `;
}
