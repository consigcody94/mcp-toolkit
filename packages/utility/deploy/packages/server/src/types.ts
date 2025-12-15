/**
 * Type system for DropShip deployment platform
 */

export interface Project {
  id: string;
  name: string;
  subdomain: string; // e.g., "my-app" for my-app.localhost
  repository?: string; // Git repository URL
  branch?: string; // Git branch to deploy
  framework?: Framework;
  buildCommand?: string;
  outputDirectory?: string;
  environmentVariables?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface Deployment {
  id: string;
  projectId: string;
  status: DeploymentStatus;
  url: string; // Full deployment URL
  commitHash?: string;
  commitMessage?: string;
  buildLog: string[];
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export type DeploymentStatus =
  | 'queued'
  | 'building'
  | 'deploying'
  | 'ready'
  | 'failed'
  | 'cancelled';

export type Framework =
  | 'static'
  | 'nextjs'
  | 'react'
  | 'vue'
  | 'vite'
  | 'svelte'
  | 'angular'
  | 'gatsby'
  | 'hugo'
  | 'jekyll';

export interface BuildConfig {
  framework: Framework;
  buildCommand: string;
  outputDirectory: string;
  installCommand: string;
  packageManager: 'npm' | 'yarn' | 'pnpm';
}

export interface FrameworkDetection {
  framework: Framework;
  confidence: number; // 0-1
  indicators: string[];
}

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  path: string;
}

export interface DeploymentRequest {
  projectName: string;
  subdomain: string;
  source: 'upload' | 'git';
  repositoryUrl?: string;
  branch?: string;
  environmentVariables?: Record<string, string>;
}

export interface ProxyTarget {
  subdomain: string;
  port: number;
  path: string; // Path to deployed files
  ssl: boolean;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  deploymentId?: string;
}

export interface BuildResult {
  success: boolean;
  outputPath: string;
  buildTime: number; // milliseconds
  logs: string[];
  error?: string;
}

export interface ServerConfig {
  port: number;
  host: string;
  dataDirectory: string;
  deploymentsDirectory: string;
  buildsDirectory: string;
  logsDirectory: string;
  maxUploadSize: number; // bytes
  enableSSL: boolean;
  sslPort: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ProjectStats {
  totalDeployments: number;
  successfulDeployments: number;
  failedDeployments: number;
  lastDeployment?: Deployment;
  averageBuildTime: number;
}

export interface SystemStats {
  totalProjects: number;
  totalDeployments: number;
  activeDeployments: number;
  diskUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
}
