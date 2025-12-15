/**
 * SiteFast - Lightning-fast local deployment platform
 * Main server entry point
 */

import express from 'express';
import cors from 'cors';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { config } from 'dotenv';
import { DatabaseService } from './database.js';
import { DeploymentManager } from './deployment-manager.js';
import { createAPIRouter } from './routes.js';
import { createProxyServer } from './proxy.js';

// Load environment variables
config();

const PORT = parseInt(process.env.PORT || '3000');
const API_PORT = parseInt(process.env.API_PORT || '3001');
const HOST = process.env.HOST || 'localhost';
const BASE_DOMAIN = process.env.BASE_DOMAIN || 'localhost';

// Setup directories
const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), 'data');
const DEPLOYMENTS_DIR = join(DATA_DIR, 'deployments');
const BUILDS_DIR = join(DATA_DIR, 'builds');
const DB_PATH = join(DATA_DIR, 'sitefast.db');

[DATA_DIR, DEPLOYMENTS_DIR, BUILDS_DIR].forEach((dir) => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

// Initialize services
const db = new DatabaseService(DB_PATH);
const deploymentManager = new DeploymentManager(
  db,
  DEPLOYMENTS_DIR,
  BUILDS_DIR,
  BASE_DOMAIN
);

// Create API server
const apiApp = express();

apiApp.use(cors());
apiApp.use(express.json());
apiApp.use(express.urlencoded({ extended: true }));

// API routes
apiApp.use('/api', createAPIRouter(db, deploymentManager));

// Health check
apiApp.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    uptime: process.uptime(),
  });
});

// Start API server
apiApp.listen(API_PORT, () => {
  console.log(`\n⚡ SiteFast API Server`);
  console.log(`   API: http://${HOST}:${API_PORT}`);
  console.log(`   Database: ${DB_PATH}`);
  console.log(`   Deployments: ${DEPLOYMENTS_DIR}\n`);
});

// Start proxy server for deployments
createProxyServer(db, DEPLOYMENTS_DIR, BASE_DOMAIN, PORT);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down SiteFast...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Shutting down SiteFast...');
  db.close();
  process.exit(0);
});
