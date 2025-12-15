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

export interface Project {
  id: string;
  name: string;
  subdomain: string;
  repository?: string;
  branch?: string;
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
  url: string;
  commitHash?: string;
  commitMessage?: string;
  buildLog: string[];
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface Stats {
  totalProjects: number;
  totalDeployments: number;
  activeDeployments: number;
  failedDeployments: number;
  uptime: number;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
