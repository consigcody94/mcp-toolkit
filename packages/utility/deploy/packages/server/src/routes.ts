/**
 * API routes for SiteFast
 */

import { Router } from 'express';
import multer from 'multer';
import { DatabaseService } from './database.js';
import { DeploymentManager } from './deployment-manager.js';
import type { APIResponse, DeploymentRequest } from './types.js';

const upload = multer({ dest: 'uploads/' });

export function createAPIRouter(
  db: DatabaseService,
  deploymentManager: DeploymentManager
): Router {
  const router = Router();

  // ====================  Projects ====================

  /**
   * GET /api/projects
   * List all projects
   */
  router.get('/projects', (req, res) => {
    try {
      const projects = db.getAllProjects();
      res.json({
        success: true,
        data: projects,
      } as APIResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
      } as APIResponse);
    }
  });

  /**
   * GET /api/projects/:id
   * Get a specific project
   */
  router.get('/projects/:id', (req, res) => {
    try {
      const project = db.getProject(req.params.id);

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found',
        } as APIResponse);
      }

      res.json({
        success: true,
        data: project,
      } as APIResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
      } as APIResponse);
    }
  });

  /**
   * DELETE /api/projects/:subdomain
   * Delete a project and its deployments
   */
  router.delete('/projects/:subdomain', (req, res) => {
    try {
      deploymentManager.deleteDeployment(req.params.subdomain);

      res.json({
        success: true,
        message: 'Project deleted successfully',
      } as APIResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
      } as APIResponse);
    }
  });

  // ==================== Deployments ====================

  /**
   * POST /api/deploy/upload
   * Deploy from uploaded file (zip/tar)
   */
  router.post('/deploy/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
        } as APIResponse);
      }

      const request: DeploymentRequest = {
        projectName: req.body.projectName || req.file.originalname.split('.')[0],
        subdomain: req.body.subdomain || req.file.originalname.split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '-'),
        source: 'upload',
        environmentVariables: req.body.environmentVariables ? JSON.parse(req.body.environmentVariables) : {},
      };

      // Start deployment in background
      deploymentManager.deployFromUpload(request, req.file.path).then(
        (deployment) => {
          console.log(`✅ Deployment ${deployment.id} completed with status: ${deployment.status}`);
        },
        (error) => {
          console.error(`❌ Deployment failed:`, error);
        }
      );

      res.json({
        success: true,
        message: 'Deployment started',
        data: request,
      } as APIResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
      } as APIResponse);
    }
  });

  /**
   * POST /api/deploy/git
   * Deploy from Git repository
   */
  router.post('/deploy/git', async (req, res) => {
    try {
      const request: DeploymentRequest = {
        projectName: req.body.projectName,
        subdomain: req.body.subdomain,
        source: 'git',
        repositoryUrl: req.body.repositoryUrl,
        branch: req.body.branch || 'main',
        environmentVariables: req.body.environmentVariables || {},
      };

      if (!request.repositoryUrl) {
        return res.status(400).json({
          success: false,
          error: 'Repository URL is required',
        } as APIResponse);
      }

      // Start deployment in background
      deploymentManager.deployFromGit(request).then(
        (deployment) => {
          console.log(`✅ Deployment ${deployment.id} completed with status: ${deployment.status}`);
        },
        (error) => {
          console.error(`❌ Deployment failed:`, error);
        }
      );

      res.json({
        success: true,
        message: 'Deployment started',
        data: request,
      } as APIResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
      } as APIResponse);
    }
  });

  /**
   * POST /api/projects/:id/redeploy
   * Redeploy an existing project
   */
  router.post('/projects/:id/redeploy', async (req, res) => {
    try {
      const project = db.getProject(req.params.id);

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found',
        } as APIResponse);
      }

      // Start redeployment in background
      deploymentManager.redeploy(req.params.id).then(
        (deployment) => {
          console.log(`✅ Redeployment ${deployment.id} completed with status: ${deployment.status}`);
        },
        (error) => {
          console.error(`❌ Redeployment failed:`, error);
        }
      );

      res.json({
        success: true,
        message: 'Redeployment started',
      } as APIResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
      } as APIResponse);
    }
  });

  /**
   * GET /api/projects/:id/deployments
   * Get all deployments for a project
   */
  router.get('/projects/:id/deployments', (req, res) => {
    try {
      const deployments = db.getProjectDeployments(req.params.id);

      res.json({
        success: true,
        data: deployments,
      } as APIResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
      } as APIResponse);
    }
  });

  /**
   * GET /api/deployments/:id
   * Get deployment details
   */
  router.get('/deployments/:id', (req, res) => {
    try {
      const deployment = db.getDeployment(req.params.id);

      if (!deployment) {
        return res.status(404).json({
          success: false,
          error: 'Deployment not found',
        } as APIResponse);
      }

      res.json({
        success: true,
        data: deployment,
      } as APIResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
      } as APIResponse);
    }
  });

  /**
   * GET /api/deployments/:id/logs
   * Get deployment build logs
   */
  router.get('/deployments/:id/logs', (req, res) => {
    try {
      const deployment = db.getDeployment(req.params.id);

      if (!deployment) {
        return res.status(404).json({
          success: false,
          error: 'Deployment not found',
        } as APIResponse);
      }

      res.json({
        success: true,
        data: {
          deploymentId: deployment.id,
          status: deployment.status,
          logs: deployment.buildLog,
        },
      } as APIResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
      } as APIResponse);
    }
  });

  // ==================== System ====================

  /**
   * GET /api/stats
   * Get system statistics
   */
  router.get('/stats', (req, res) => {
    try {
      const projects = db.getAllProjects();
      const allDeployments = projects.flatMap((p) => db.getProjectDeployments(p.id));

      const stats = {
        totalProjects: projects.length,
        totalDeployments: allDeployments.length,
        activeDeployments: allDeployments.filter((d) => d.status === 'ready').length,
        failedDeployments: allDeployments.filter((d) => d.status === 'failed').length,
        uptime: process.uptime(),
      };

      res.json({
        success: true,
        data: stats,
      } as APIResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
      } as APIResponse);
    }
  });

  return router;
}
