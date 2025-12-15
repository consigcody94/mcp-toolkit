/**
 * Deployment manager - orchestrates the entire deployment process
 */

import { join } from 'path';
import { mkdirSync, existsSync, cpSync, rmSync } from 'fs';
import { nanoid } from 'nanoid';
import simpleGit from 'simple-git';
import extractZip from 'extract-zip';
import tar from 'tar';
import { BuildEngine } from './build-engine.js';
import { DatabaseService } from './database.js';
import type {
  Project,
  Deployment,
  DeploymentRequest,
} from './types.js';

export class DeploymentManager {
  private buildEngine: BuildEngine;
  private db: DatabaseService;
  private deploymentsDir: string;
  private buildsDir: string;
  private baseUrl: string;

  constructor(
    db: DatabaseService,
    deploymentsDir: string,
    buildsDir: string,
    baseUrl: string
  ) {
    this.db = db;
    this.buildEngine = new BuildEngine();
    this.deploymentsDir = deploymentsDir;
    this.buildsDir = buildsDir;
    this.baseUrl = baseUrl;

    // Ensure directories exist
    if (!existsSync(deploymentsDir)) {
      mkdirSync(deploymentsDir, { recursive: true });
    }
    if (!existsSync(buildsDir)) {
      mkdirSync(buildsDir, { recursive: true });
    }
  }

  /**
   * Deploy from uploaded file (zip/tar)
   */
  async deployFromUpload(
    request: DeploymentRequest,
    uploadedFilePath: string,
    onLog?: (message: string) => void
  ): Promise<Deployment> {
    const projectId = nanoid();
    const deploymentId = nanoid();
    const buildPath = join(this.buildsDir, deploymentId);

    const log = (message: string) => {
      this.db.addDeploymentLog(deploymentId, message);
      if (onLog) onLog(message);
    };

    try {
      // Create project
      const project: Project = {
        id: projectId,
        name: request.projectName,
        subdomain: request.subdomain,
        environmentVariables: request.environmentVariables,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.db.createProject(project);

      // Create deployment record
      const deployment: Deployment = {
        id: deploymentId,
        projectId,
        status: 'queued',
        url: `http://${request.subdomain}.${this.baseUrl}`,
        buildLog: [],
        createdAt: new Date().toISOString(),
      };

      this.db.createDeployment(deployment);

      // Extract uploaded file
      log(`📦 Extracting uploaded files...`);
      mkdirSync(buildPath, { recursive: true });

      const ext = uploadedFilePath.split('.').pop()?.toLowerCase();
      if (ext === 'zip') {
        await extractZip(uploadedFilePath, { dir: buildPath });
      } else if (ext === 'tar' || ext === 'gz' || ext === 'tgz') {
        await tar.extract({ file: uploadedFilePath, cwd: buildPath });
      } else {
        // Assume it's a directory upload
        cpSync(uploadedFilePath, buildPath, { recursive: true });
      }

      log(`✅ Files extracted`);

      // Update status to building
      this.db.updateDeploymentStatus(deploymentId, 'building');

      // Build the project
      const buildResult = await this.buildEngine.build(
        buildPath,
        request.environmentVariables || {},
        log
      );

      if (!buildResult.success) {
        this.db.updateDeploymentStatus(
          deploymentId,
          'failed',
          buildResult.logs,
          buildResult.error
        );

        return this.db.getDeployment(deploymentId)!;
      }

      // Deploy (copy to deployments directory)
      this.db.updateDeploymentStatus(deploymentId, 'deploying');
      log(`🚀 Deploying to ${request.subdomain}.${this.baseUrl}...`);

      const deployPath = join(this.deploymentsDir, request.subdomain);
      if (existsSync(deployPath)) {
        rmSync(deployPath, { recursive: true, force: true });
      }

      cpSync(buildResult.outputPath, deployPath, { recursive: true });
      log(`✅ Deployed successfully`);

      // Update project with detected framework
      const buildConfig = this.buildEngine.getBuildConfig(buildPath);
      this.db.updateProject(projectId, {
        framework: buildConfig.framework,
        buildCommand: buildConfig.buildCommand,
        outputDirectory: buildConfig.outputDirectory,
      });

      // Mark as ready
      this.db.updateDeploymentStatus(deploymentId, 'ready', buildResult.logs);

      return this.db.getDeployment(deploymentId)!;
    } catch (error) {
      const errorMessage = (error as Error).message;

      this.db.updateDeploymentStatus(
        deploymentId,
        'failed',
        undefined,
        errorMessage
      );

      log(`❌ Deployment failed: ${errorMessage}`);

      return this.db.getDeployment(deploymentId)!;
    } finally {
      // Cleanup build directory
      if (existsSync(buildPath)) {
        rmSync(buildPath, { recursive: true, force: true });
      }
    }
  }

  /**
   * Deploy from Git repository
   */
  async deployFromGit(
    request: DeploymentRequest,
    onLog?: (message: string) => void
  ): Promise<Deployment> {
    if (!request.repositoryUrl) {
      throw new Error('Repository URL is required for Git deployments');
    }

    const projectId = nanoid();
    const deploymentId = nanoid();
    const buildPath = join(this.buildsDir, deploymentId);

    const log = (message: string) => {
      this.db.addDeploymentLog(deploymentId, message);
      if (onLog) onLog(message);
    };

    try {
      // Create project
      const project: Project = {
        id: projectId,
        name: request.projectName,
        subdomain: request.subdomain,
        repository: request.repositoryUrl,
        branch: request.branch || 'main',
        environmentVariables: request.environmentVariables,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.db.createProject(project);

      // Create deployment record
      const deployment: Deployment = {
        id: deploymentId,
        projectId,
        status: 'queued',
        url: `http://${request.subdomain}.${this.baseUrl}`,
        buildLog: [],
        createdAt: new Date().toISOString(),
      };

      this.db.createDeployment(deployment);

      // Clone repository
      log(`📥 Cloning repository from ${request.repositoryUrl}...`);
      const git = simpleGit();
      await git.clone(request.repositoryUrl, buildPath, {
        '--depth': 1,
        '--branch': request.branch || 'main',
      });

      const gitLog = await simpleGit(buildPath).log(['-1']);
      const commitHash = gitLog.latest?.hash || 'unknown';
      const commitMessage = gitLog.latest?.message || 'No commit message';

      log(`✅ Cloned at commit ${commitHash.substring(0, 7)}: ${commitMessage}`);

      // Update deployment with commit info
      const updatedDeployment = this.db.getDeployment(deploymentId)!;
      updatedDeployment.commitHash = commitHash;
      updatedDeployment.commitMessage = commitMessage;

      // Build the project
      this.db.updateDeploymentStatus(deploymentId, 'building');

      const buildResult = await this.buildEngine.build(
        buildPath,
        request.environmentVariables || {},
        log
      );

      if (!buildResult.success) {
        this.db.updateDeploymentStatus(
          deploymentId,
          'failed',
          buildResult.logs,
          buildResult.error
        );

        return this.db.getDeployment(deploymentId)!;
      }

      // Deploy
      this.db.updateDeploymentStatus(deploymentId, 'deploying');
      log(`🚀 Deploying to ${request.subdomain}.${this.baseUrl}...`);

      const deployPath = join(this.deploymentsDir, request.subdomain);
      if (existsSync(deployPath)) {
        rmSync(deployPath, { recursive: true, force: true });
      }

      cpSync(buildResult.outputPath, deployPath, { recursive: true });
      log(`✅ Deployed successfully`);

      // Update project with detected framework
      const buildConfig = this.buildEngine.getBuildConfig(buildPath);
      this.db.updateProject(projectId, {
        framework: buildConfig.framework,
        buildCommand: buildConfig.buildCommand,
        outputDirectory: buildConfig.outputDirectory,
      });

      // Mark as ready
      this.db.updateDeploymentStatus(deploymentId, 'ready', buildResult.logs);

      return this.db.getDeployment(deploymentId)!;
    } catch (error) {
      const errorMessage = (error as Error).message;

      this.db.updateDeploymentStatus(
        deploymentId,
        'failed',
        undefined,
        errorMessage
      );

      log(`❌ Deployment failed: ${errorMessage}`);

      return this.db.getDeployment(deploymentId)!;
    } finally {
      // Cleanup build directory
      if (existsSync(buildPath)) {
        rmSync(buildPath, { recursive: true, force: true });
      }
    }
  }

  /**
   * Redeploy an existing project
   */
  async redeploy(projectId: string, onLog?: (message: string) => void): Promise<Deployment> {
    const project = this.db.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    if (!project.repository) {
      throw new Error('Cannot redeploy: project was not deployed from Git');
    }

    const request: DeploymentRequest = {
      projectName: project.name,
      subdomain: project.subdomain,
      source: 'git',
      repositoryUrl: project.repository,
      branch: project.branch,
      environmentVariables: project.environmentVariables,
    };

    return this.deployFromGit(request, onLog);
  }

  /**
   * Delete a deployment and cleanup files
   */
  deleteDeployment(subdomain: string): void {
    const project = this.db.getProjectBySubdomain(subdomain);
    if (!project) {
      throw new Error('Project not found');
    }

    // Delete deployed files
    const deployPath = join(this.deploymentsDir, subdomain);
    if (existsSync(deployPath)) {
      rmSync(deployPath, { recursive: true, force: true });
    }

    // Delete project (cascades to deployments)
    this.db.deleteProject(project.id);
  }
}
