import axios, { AxiosInstance } from 'axios';
import type { Project, Deployment, Stats, APIResponse } from '../types';

class APIClient {
  private client: AxiosInstance;

  constructor(baseURL: string = '/api') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    const response = await this.client.get<APIResponse<Project[]>>('/projects');
    return response.data.data || [];
  }

  async getProject(id: string): Promise<Project> {
    const response = await this.client.get<APIResponse<Project>>(`/projects/${id}`);
    if (!response.data.data) {
      throw new Error('Project not found');
    }
    return response.data.data;
  }

  async deleteProject(subdomain: string): Promise<void> {
    await this.client.delete(`/projects/${subdomain}`);
  }

  // Deployments
  async deployFromUpload(
    file: File,
    projectName: string,
    subdomain: string,
    environmentVariables?: Record<string, string>
  ): Promise<APIResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectName', projectName);
    formData.append('subdomain', subdomain);

    if (environmentVariables) {
      formData.append('environmentVariables', JSON.stringify(environmentVariables));
    }

    const response = await this.client.post<APIResponse>('/deploy/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async deployFromGit(
    projectName: string,
    subdomain: string,
    repositoryUrl: string,
    branch: string = 'main',
    environmentVariables?: Record<string, string>
  ): Promise<APIResponse> {
    const response = await this.client.post<APIResponse>('/deploy/git', {
      projectName,
      subdomain,
      repositoryUrl,
      branch,
      environmentVariables,
    });

    return response.data;
  }

  async redeploy(projectId: string): Promise<APIResponse> {
    const response = await this.client.post<APIResponse>(`/projects/${projectId}/redeploy`);
    return response.data;
  }

  async getProjectDeployments(projectId: string): Promise<Deployment[]> {
    const response = await this.client.get<APIResponse<Deployment[]>>(
      `/projects/${projectId}/deployments`
    );
    return response.data.data || [];
  }

  async getDeployment(id: string): Promise<Deployment> {
    const response = await this.client.get<APIResponse<Deployment>>(`/deployments/${id}`);
    if (!response.data.data) {
      throw new Error('Deployment not found');
    }
    return response.data.data;
  }

  async getDeploymentLogs(id: string): Promise<{ deploymentId: string; status: string; logs: string[] }> {
    const response = await this.client.get<APIResponse<{ deploymentId: string; status: string; logs: string[] }>>(
      `/deployments/${id}/logs`
    );
    if (!response.data.data) {
      throw new Error('Logs not found');
    }
    return response.data.data;
  }

  // System
  async getStats(): Promise<Stats> {
    const response = await this.client.get<APIResponse<Stats>>('/stats');
    if (!response.data.data) {
      throw new Error('Stats not available');
    }
    return response.data.data;
  }

  async getHealth(): Promise<{ status: string; version: string; uptime: number }> {
    const response = await this.client.get<{ status: string; version: string; uptime: number }>('/health');
    return response.data;
  }
}

export const apiClient = new APIClient();
