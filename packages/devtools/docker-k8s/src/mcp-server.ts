#!/usr/bin/env node
/**
 * Infrastructure Pilot MCP Server
 * Control Docker and Kubernetes with natural language through Claude Desktop
 */

import { DockerClient } from './docker/docker-client.js';
import { KubernetesClient } from './kubernetes/k8s-client.js';
import type {
  MCPRequest,
  MCPResponse,
  MCPTool,
  DockerConfig,
  K8sConfig,
} from './types.js';

class InfraPilotMCPServer {
  private docker: DockerClient | null = null;
  private k8s: KubernetesClient | null = null;

  constructor() {
    this.setupStdio();
  }

  /**
   * Setup stdin/stdout communication for MCP protocol
   */
  private setupStdio(): void {
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', async (data: string) => {
      try {
        const requests = data.trim().split('\n').filter(Boolean);

        for (const line of requests) {
          const request: MCPRequest = JSON.parse(line);
          const response = await this.handleRequest(request);
          this.send(response);
        }
      } catch (error) {
        this.sendError(0, -32700, 'Parse error', (error as Error).message);
      }
    });
  }

  /**
   * Handle incoming MCP request
   */
  private async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    const { id, method, params } = request;

    try {
      switch (method) {
        case 'initialize':
          return this.initialize(id);

        case 'tools/list':
          return this.listTools(id);

        case 'tools/call':
          return await this.callTool(id, params);

        default:
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: 'Method not found',
            },
          };
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: 'Internal error',
          data: (error as Error).message,
        },
      };
    }
  }

  /**
   * Initialize MCP server
   */
  private initialize(id: string | number): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'infra-pilot',
          version: '1.0.0',
        },
      },
    };
  }

  /**
   * List all available tools
   */
  private listTools(id: string | number): MCPResponse {
    const tools: MCPTool[] = [
      // Connection tools
      {
        name: 'connect_docker',
        description: 'Connect to Docker daemon',
        inputSchema: {
          type: 'object',
          properties: {
            socketPath: {
              type: 'string',
              description: 'Path to Docker socket (default: /var/run/docker.sock)',
            },
            host: {
              type: 'string',
              description: 'Docker daemon host',
            },
            port: {
              type: 'number',
              description: 'Docker daemon port',
            },
          },
          required: [],
        },
      },
      {
        name: 'connect_kubernetes',
        description: 'Connect to Kubernetes cluster',
        inputSchema: {
          type: 'object',
          properties: {
            kubeconfig: {
              type: 'string',
              description: 'Path to kubeconfig file',
            },
            context: {
              type: 'string',
              description: 'Kubernetes context to use',
            },
            namespace: {
              type: 'string',
              description: 'Default namespace',
            },
          },
          required: [],
        },
      },

      // Docker Container tools
      {
        name: 'docker_list_containers',
        description: 'List all Docker containers',
        inputSchema: {
          type: 'object',
          properties: {
            all: {
              type: 'boolean',
              description: 'Include stopped containers',
            },
          },
          required: [],
        },
      },
      {
        name: 'docker_start_container',
        description: 'Start a Docker container',
        inputSchema: {
          type: 'object',
          properties: {
            nameOrId: {
              type: 'string',
              description: 'Container name or ID',
            },
          },
          required: ['nameOrId'],
        },
      },
      {
        name: 'docker_stop_container',
        description: 'Stop a Docker container',
        inputSchema: {
          type: 'object',
          properties: {
            nameOrId: {
              type: 'string',
              description: 'Container name or ID',
            },
            timeout: {
              type: 'number',
              description: 'Timeout in seconds (default: 10)',
            },
          },
          required: ['nameOrId'],
        },
      },
      {
        name: 'docker_restart_container',
        description: 'Restart a Docker container',
        inputSchema: {
          type: 'object',
          properties: {
            nameOrId: {
              type: 'string',
              description: 'Container name or ID',
            },
          },
          required: ['nameOrId'],
        },
      },
      {
        name: 'docker_remove_container',
        description: 'Remove a Docker container',
        inputSchema: {
          type: 'object',
          properties: {
            nameOrId: {
              type: 'string',
              description: 'Container name or ID',
            },
            force: {
              type: 'boolean',
              description: 'Force removal',
            },
          },
          required: ['nameOrId'],
        },
      },
      {
        name: 'docker_container_logs',
        description: 'Get Docker container logs',
        inputSchema: {
          type: 'object',
          properties: {
            nameOrId: {
              type: 'string',
              description: 'Container name or ID',
            },
            tail: {
              type: 'number',
              description: 'Number of lines to show (default: 100)',
            },
          },
          required: ['nameOrId'],
        },
      },
      {
        name: 'docker_container_stats',
        description: 'Get Docker container resource stats',
        inputSchema: {
          type: 'object',
          properties: {
            nameOrId: {
              type: 'string',
              description: 'Container name or ID',
            },
          },
          required: ['nameOrId'],
        },
      },

      // Docker Image tools
      {
        name: 'docker_list_images',
        description: 'List all Docker images',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'docker_pull_image',
        description: 'Pull a Docker image',
        inputSchema: {
          type: 'object',
          properties: {
            imageName: {
              type: 'string',
              description: 'Image name (e.g., nginx:latest)',
            },
          },
          required: ['imageName'],
        },
      },
      {
        name: 'docker_remove_image',
        description: 'Remove a Docker image',
        inputSchema: {
          type: 'object',
          properties: {
            nameOrId: {
              type: 'string',
              description: 'Image name or ID',
            },
            force: {
              type: 'boolean',
              description: 'Force removal',
            },
          },
          required: ['nameOrId'],
        },
      },

      // Docker Volume tools
      {
        name: 'docker_list_volumes',
        description: 'List all Docker volumes',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },

      // Docker Network tools
      {
        name: 'docker_list_networks',
        description: 'List all Docker networks',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },

      // Kubernetes Pod tools
      {
        name: 'k8s_list_pods',
        description: 'List Kubernetes pods',
        inputSchema: {
          type: 'object',
          properties: {
            namespace: {
              type: 'string',
              description: 'Namespace (default: default)',
            },
          },
          required: [],
        },
      },
      {
        name: 'k8s_get_pod',
        description: 'Get a specific Kubernetes pod',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Pod name',
            },
            namespace: {
              type: 'string',
              description: 'Namespace (default: default)',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'k8s_delete_pod',
        description: 'Delete a Kubernetes pod',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Pod name',
            },
            namespace: {
              type: 'string',
              description: 'Namespace (default: default)',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'k8s_pod_logs',
        description: 'Get Kubernetes pod logs',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Pod name',
            },
            namespace: {
              type: 'string',
              description: 'Namespace (default: default)',
            },
            container: {
              type: 'string',
              description: 'Container name (optional)',
            },
            tail: {
              type: 'number',
              description: 'Number of lines (default: 100)',
            },
          },
          required: ['name'],
        },
      },

      // Kubernetes Deployment tools
      {
        name: 'k8s_list_deployments',
        description: 'List Kubernetes deployments',
        inputSchema: {
          type: 'object',
          properties: {
            namespace: {
              type: 'string',
              description: 'Namespace (default: default)',
            },
          },
          required: [],
        },
      },
      {
        name: 'k8s_get_deployment',
        description: 'Get a specific Kubernetes deployment',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Deployment name',
            },
            namespace: {
              type: 'string',
              description: 'Namespace (default: default)',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'k8s_scale_deployment',
        description: 'Scale a Kubernetes deployment',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Deployment name',
            },
            replicas: {
              type: 'number',
              description: 'Number of replicas',
            },
            namespace: {
              type: 'string',
              description: 'Namespace (default: default)',
            },
          },
          required: ['name', 'replicas'],
        },
      },
      {
        name: 'k8s_restart_deployment',
        description: 'Restart a Kubernetes deployment (rolling restart)',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Deployment name',
            },
            namespace: {
              type: 'string',
              description: 'Namespace (default: default)',
            },
          },
          required: ['name'],
        },
      },

      // Kubernetes Service tools
      {
        name: 'k8s_list_services',
        description: 'List Kubernetes services',
        inputSchema: {
          type: 'object',
          properties: {
            namespace: {
              type: 'string',
              description: 'Namespace (default: default)',
            },
          },
          required: [],
        },
      },
      {
        name: 'k8s_get_service',
        description: 'Get a specific Kubernetes service',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Service name',
            },
            namespace: {
              type: 'string',
              description: 'Namespace (default: default)',
            },
          },
          required: ['name'],
        },
      },

      // Kubernetes Node tools
      {
        name: 'k8s_list_nodes',
        description: 'List Kubernetes cluster nodes',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'k8s_get_node',
        description: 'Get a specific Kubernetes node',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Node name',
            },
          },
          required: ['name'],
        },
      },

      // Kubernetes Namespace tools
      {
        name: 'k8s_list_namespaces',
        description: 'List all Kubernetes namespaces',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'k8s_create_namespace',
        description: 'Create a Kubernetes namespace',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Namespace name',
            },
          },
          required: ['name'],
        },
      },

      // Info tools
      {
        name: 'get_info',
        description: 'Get Docker and Kubernetes cluster information',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    ];

    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools,
      },
    };
  }

  /**
   * Call a specific tool
   */
  private async callTool(
    id: string | number,
    params?: { name?: string; arguments?: Record<string, unknown> }
  ): Promise<MCPResponse> {
    if (!params?.name) {
      throw new Error('Tool name is required');
    }

    const toolName = params.name;
    const args = params.arguments || {};

    let result: unknown;

    try {
      switch (toolName) {
        // Connection tools
        case 'connect_docker':
          result = await this.connectDocker(args as DockerConfig);
          break;

        case 'connect_kubernetes':
          result = await this.connectKubernetes(args as K8sConfig);
          break;

        // Docker Container tools
        case 'docker_list_containers':
          result = await this.dockerListContainers(args.all as boolean);
          break;

        case 'docker_start_container':
          result = await this.dockerStartContainer(args.nameOrId as string);
          break;

        case 'docker_stop_container':
          result = await this.dockerStopContainer(
            args.nameOrId as string,
            args.timeout as number
          );
          break;

        case 'docker_restart_container':
          result = await this.dockerRestartContainer(args.nameOrId as string);
          break;

        case 'docker_remove_container':
          result = await this.dockerRemoveContainer(
            args.nameOrId as string,
            args.force as boolean
          );
          break;

        case 'docker_container_logs':
          result = await this.dockerContainerLogs(
            args.nameOrId as string,
            args.tail as number
          );
          break;

        case 'docker_container_stats':
          result = await this.dockerContainerStats(args.nameOrId as string);
          break;

        // Docker Image tools
        case 'docker_list_images':
          result = await this.dockerListImages();
          break;

        case 'docker_pull_image':
          result = await this.dockerPullImage(args.imageName as string);
          break;

        case 'docker_remove_image':
          result = await this.dockerRemoveImage(
            args.nameOrId as string,
            args.force as boolean
          );
          break;

        // Docker Volume tools
        case 'docker_list_volumes':
          result = await this.dockerListVolumes();
          break;

        // Docker Network tools
        case 'docker_list_networks':
          result = await this.dockerListNetworks();
          break;

        // Kubernetes Pod tools
        case 'k8s_list_pods':
          result = await this.k8sListPods(args.namespace as string);
          break;

        case 'k8s_get_pod':
          result = await this.k8sGetPod(
            args.name as string,
            args.namespace as string
          );
          break;

        case 'k8s_delete_pod':
          result = await this.k8sDeletePod(
            args.name as string,
            args.namespace as string
          );
          break;

        case 'k8s_pod_logs':
          result = await this.k8sPodLogs(
            args.name as string,
            args.namespace as string,
            args.container as string,
            args.tail as number
          );
          break;

        // Kubernetes Deployment tools
        case 'k8s_list_deployments':
          result = await this.k8sListDeployments(args.namespace as string);
          break;

        case 'k8s_get_deployment':
          result = await this.k8sGetDeployment(
            args.name as string,
            args.namespace as string
          );
          break;

        case 'k8s_scale_deployment':
          result = await this.k8sScaleDeployment(
            args.name as string,
            args.replicas as number,
            args.namespace as string
          );
          break;

        case 'k8s_restart_deployment':
          result = await this.k8sRestartDeployment(
            args.name as string,
            args.namespace as string
          );
          break;

        // Kubernetes Service tools
        case 'k8s_list_services':
          result = await this.k8sListServices(args.namespace as string);
          break;

        case 'k8s_get_service':
          result = await this.k8sGetService(
            args.name as string,
            args.namespace as string
          );
          break;

        // Kubernetes Node tools
        case 'k8s_list_nodes':
          result = await this.k8sListNodes();
          break;

        case 'k8s_get_node':
          result = await this.k8sGetNode(args.name as string);
          break;

        // Kubernetes Namespace tools
        case 'k8s_list_namespaces':
          result = await this.k8sListNamespaces();
          break;

        case 'k8s_create_namespace':
          result = await this.k8sCreateNamespace(args.name as string);
          break;

        // Info tools
        case 'get_info':
          result = await this.getInfo();
          break;

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }

      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        },
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: `Error: ${(error as Error).message}`,
            },
          ],
          isError: true,
        },
      };
    }
  }

  // ============================================================================
  // Tool Implementations
  // ============================================================================

  private ensureDocker(): void {
    if (!this.docker) {
      throw new Error('Not connected to Docker. Call connect_docker first.');
    }
  }

  private ensureKubernetes(): void {
    if (!this.k8s) {
      throw new Error('Not connected to Kubernetes. Call connect_kubernetes first.');
    }
  }

  private async connectDocker(config: DockerConfig): Promise<string> {
    this.docker = new DockerClient(config);
    await this.docker.connect();
    const info = await this.docker.getInfo();
    return this.formatMarkdown(`
# 🐳 Connected to Docker

**Version:** ${info.version}
**Containers:** ${info.info.Containers} (${info.info.ContainersRunning} running)
**Images:** ${info.info.Images}
**Server Version:** ${info.info.ServerVersion}
**OS/Arch:** ${info.info.OperatingSystem} / ${info.info.Architecture}

Ready to manage Docker containers!
    `);
  }

  private async connectKubernetes(config: K8sConfig): Promise<string> {
    this.k8s = new KubernetesClient(config);
    await this.k8s.connect();
    const info = await this.k8s.getClusterInfo();
    return this.formatMarkdown(`
# ☸️ Connected to Kubernetes

**Version:** ${info.version}
**Context:** ${info.currentContext}
**Namespace:** ${info.namespace}

Ready to manage Kubernetes cluster!
    `);
  }

  private async dockerListContainers(all = true): Promise<string> {
    this.ensureDocker();
    const containers = await this.docker!.listContainers(all);

    if (containers.length === 0) {
      return this.formatMarkdown('# 🐳 Docker Containers\n\nNo containers found.');
    }

    const rows = containers.map(c => {
      const status = c.state === 'running' ? '✅' : '⏸️';
      const ports = c.ports.map(p =>
        p.publicPort ? `${p.publicPort}:${p.privatePort}` : `${p.privatePort}`
      ).join(', ') || 'none';

      return `| ${status} | \`${c.name}\` | \`${c.image}\` | ${c.status} | ${ports} |`;
    }).join('\n');

    return this.formatMarkdown(`
# 🐳 Docker Containers

| Status | Name | Image | Status | Ports |
|--------|------|-------|--------|-------|
${rows}

**Total:** ${containers.length} containers
    `);
  }

  private async dockerStartContainer(nameOrId: string): Promise<string> {
    this.ensureDocker();
    const result = await this.docker!.startContainer(nameOrId);
    return this.formatResult(result);
  }

  private async dockerStopContainer(nameOrId: string, timeout?: number): Promise<string> {
    this.ensureDocker();
    const result = await this.docker!.stopContainer(nameOrId, timeout);
    return this.formatResult(result);
  }

  private async dockerRestartContainer(nameOrId: string): Promise<string> {
    this.ensureDocker();
    const result = await this.docker!.restartContainer(nameOrId);
    return this.formatResult(result);
  }

  private async dockerRemoveContainer(nameOrId: string, force?: boolean): Promise<string> {
    this.ensureDocker();
    const result = await this.docker!.removeContainer(nameOrId, force);
    return this.formatResult(result);
  }

  private async dockerContainerLogs(nameOrId: string, tail?: number): Promise<string> {
    this.ensureDocker();
    const logs = await this.docker!.getContainerLogs(nameOrId, tail);
    return this.formatMarkdown(`
# 🐳 Container Logs: ${nameOrId}

\`\`\`
${logs}
\`\`\`
    `);
  }

  private async dockerContainerStats(nameOrId: string): Promise<string> {
    this.ensureDocker();
    const stats = await this.docker!.getContainerStats(nameOrId);
    return this.formatMarkdown(`
# 🐳 Container Stats: ${nameOrId}

**CPU Usage:** ${stats.cpu.percentage.toFixed(2)}%
**Memory Usage:** ${this.formatBytes(stats.memory.usage)} / ${this.formatBytes(stats.memory.limit)} (${stats.memory.percentage.toFixed(2)}%)
**Network RX/TX:** ${this.formatBytes(stats.network.rx)} / ${this.formatBytes(stats.network.tx)}
**Block I/O Read/Write:** ${this.formatBytes(stats.blockIO.read)} / ${this.formatBytes(stats.blockIO.write)}
    `);
  }

  private async dockerListImages(): Promise<string> {
    this.ensureDocker();
    const images = await this.docker!.listImages();

    if (images.length === 0) {
      return this.formatMarkdown('# 🐳 Docker Images\n\nNo images found.');
    }

    const rows = images.map(img => {
      const tags = img.repoTags.join(', ');
      return `| \`${tags}\` | ${this.formatBytes(img.size)} | ${img.created.toLocaleDateString()} |`;
    }).join('\n');

    return this.formatMarkdown(`
# 🐳 Docker Images

| Repository:Tag | Size | Created |
|----------------|------|---------|
${rows}

**Total:** ${images.length} images
    `);
  }

  private async dockerPullImage(imageName: string): Promise<string> {
    this.ensureDocker();
    const result = await this.docker!.pullImage(imageName);
    return this.formatResult(result);
  }

  private async dockerRemoveImage(nameOrId: string, force?: boolean): Promise<string> {
    this.ensureDocker();
    const result = await this.docker!.removeImage(nameOrId, force);
    return this.formatResult(result);
  }

  private async dockerListVolumes(): Promise<string> {
    this.ensureDocker();
    const volumes = await this.docker!.listVolumes();

    if (volumes.length === 0) {
      return this.formatMarkdown('# 🐳 Docker Volumes\n\nNo volumes found.');
    }

    const rows = volumes.map(vol =>
      `| \`${vol.name}\` | ${vol.driver} | ${vol.scope} |`
    ).join('\n');

    return this.formatMarkdown(`
# 🐳 Docker Volumes

| Name | Driver | Scope |
|------|--------|-------|
${rows}

**Total:** ${volumes.length} volumes
    `);
  }

  private async dockerListNetworks(): Promise<string> {
    this.ensureDocker();
    const networks = await this.docker!.listNetworks();

    const rows = networks.map(net =>
      `| \`${net.name}\` | ${net.driver} | ${net.scope} |`
    ).join('\n');

    return this.formatMarkdown(`
# 🐳 Docker Networks

| Name | Driver | Scope |
|------|--------|-------|
${rows}

**Total:** ${networks.length} networks
    `);
  }

  private async k8sListPods(namespace?: string): Promise<string> {
    this.ensureKubernetes();
    const result = await this.k8s!.listPods(namespace);

    if (result.count === 0) {
      return this.formatMarkdown(`# ☸️ Kubernetes Pods (${result.namespace})\n\nNo pods found.`);
    }

    const rows = result.items.map(pod => {
      const status = pod.status === 'Running' ? '✅' : '⚠️';
      const ready = pod.containers.filter(c => c.ready).length;
      const total = pod.containers.length;
      return `| ${status} | \`${pod.name}\` | ${ready}/${total} | ${pod.status} | ${pod.ip} | ${pod.node} |`;
    }).join('\n');

    return this.formatMarkdown(`
# ☸️ Kubernetes Pods (${result.namespace})

| Status | Name | Ready | Phase | IP | Node |
|--------|------|-------|-------|----|----|
${rows}

**Total:** ${result.count} pods
    `);
  }

  private async k8sGetPod(name: string, namespace?: string): Promise<string> {
    this.ensureKubernetes();
    const pod = await this.k8s!.getPod(name, namespace);

    const containerInfo = pod.containers.map(c =>
      `- **${c.name}**: ${c.image} (${c.ready ? '✅ Ready' : '⏸️ Not Ready'}, restarts: ${c.restartCount})`
    ).join('\n');

    return this.formatMarkdown(`
# ☸️ Pod: ${pod.name}

**Namespace:** ${pod.namespace}
**Status:** ${pod.status}
**IP:** ${pod.ip}
**Node:** ${pod.node}

## Containers
${containerInfo}

**Labels:**
\`\`\`json
${JSON.stringify(pod.labels, null, 2)}
\`\`\`
    `);
  }

  private async k8sDeletePod(name: string, namespace?: string): Promise<string> {
    this.ensureKubernetes();
    const result = await this.k8s!.deletePod(name, namespace);
    return this.formatResult(result);
  }

  private async k8sPodLogs(
    name: string,
    namespace?: string,
    container?: string,
    tail?: number
  ): Promise<string> {
    this.ensureKubernetes();
    const logs = await this.k8s!.getPodLogs(name, namespace, container, tail);
    return this.formatMarkdown(`
# ☸️ Pod Logs: ${name}${container ? ` (${container})` : ''}

\`\`\`
${logs}
\`\`\`
    `);
  }

  private async k8sListDeployments(namespace?: string): Promise<string> {
    this.ensureKubernetes();
    const result = await this.k8s!.listDeployments(namespace);

    if (result.count === 0) {
      return this.formatMarkdown(`# ☸️ Kubernetes Deployments (${result.namespace})\n\nNo deployments found.`);
    }

    const rows = result.items.map(dep => {
      const status = dep.replicas.ready === dep.replicas.desired ? '✅' : '⚠️';
      return `| ${status} | \`${dep.name}\` | ${dep.replicas.ready}/${dep.replicas.desired} | ${dep.strategy} |`;
    }).join('\n');

    return this.formatMarkdown(`
# ☸️ Kubernetes Deployments (${result.namespace})

| Status | Name | Ready/Desired | Strategy |
|--------|------|---------------|----------|
${rows}

**Total:** ${result.count} deployments
    `);
  }

  private async k8sGetDeployment(name: string, namespace?: string): Promise<string> {
    this.ensureKubernetes();
    const dep = await this.k8s!.getDeployment(name, namespace);

    return this.formatMarkdown(`
# ☸️ Deployment: ${dep.name}

**Namespace:** ${dep.namespace}
**Replicas:**
- Desired: ${dep.replicas.desired}
- Current: ${dep.replicas.current}
- Ready: ${dep.replicas.ready}
- Available: ${dep.replicas.available}

**Strategy:** ${dep.strategy}

**Labels:**
\`\`\`json
${JSON.stringify(dep.labels, null, 2)}
\`\`\`
    `);
  }

  private async k8sScaleDeployment(
    name: string,
    replicas: number,
    namespace?: string
  ): Promise<string> {
    this.ensureKubernetes();
    const result = await this.k8s!.scaleDeployment(name, replicas, namespace);
    return this.formatResult(result);
  }

  private async k8sRestartDeployment(name: string, namespace?: string): Promise<string> {
    this.ensureKubernetes();
    const result = await this.k8s!.restartDeployment(name, namespace);
    return this.formatResult(result);
  }

  private async k8sListServices(namespace?: string): Promise<string> {
    this.ensureKubernetes();
    const result = await this.k8s!.listServices(namespace);

    if (result.count === 0) {
      return this.formatMarkdown(`# ☸️ Kubernetes Services (${result.namespace})\n\nNo services found.`);
    }

    const rows = result.items.map(svc => {
      const ports = svc.ports.map(p => `${p.port}:${p.targetPort}`).join(', ');
      return `| \`${svc.name}\` | ${svc.type} | ${svc.clusterIP} | ${ports} |`;
    }).join('\n');

    return this.formatMarkdown(`
# ☸️ Kubernetes Services (${result.namespace})

| Name | Type | Cluster IP | Ports |
|------|------|------------|-------|
${rows}

**Total:** ${result.count} services
    `);
  }

  private async k8sGetService(name: string, namespace?: string): Promise<string> {
    this.ensureKubernetes();
    const svc = await this.k8s!.getService(name, namespace);

    const ports = svc.ports.map(p =>
      `- **${p.name || 'unnamed'}**: ${p.port} → ${p.targetPort} (${p.protocol})${p.nodePort ? ` [NodePort: ${p.nodePort}]` : ''}`
    ).join('\n');

    return this.formatMarkdown(`
# ☸️ Service: ${svc.name}

**Namespace:** ${svc.namespace}
**Type:** ${svc.type}
**Cluster IP:** ${svc.clusterIP}
${svc.externalIPs.length > 0 ? `**External IPs:** ${svc.externalIPs.join(', ')}` : ''}

## Ports
${ports}

**Selector:**
\`\`\`json
${JSON.stringify(svc.selector, null, 2)}
\`\`\`
    `);
  }

  private async k8sListNodes(): Promise<string> {
    this.ensureKubernetes();
    const result = await this.k8s!.listNodes();

    const rows = result.items.map(node => {
      const status = node.status === 'Ready' ? '✅' : '⚠️';
      const roles = node.roles.join(', ') || 'worker';
      return `| ${status} | \`${node.name}\` | ${roles} | ${node.version} | ${node.capacity.cpu} | ${node.capacity.memory} |`;
    }).join('\n');

    return this.formatMarkdown(`
# ☸️ Kubernetes Nodes

| Status | Name | Roles | Version | CPU | Memory |
|--------|------|-------|---------|-----|--------|
${rows}

**Total:** ${result.count} nodes
    `);
  }

  private async k8sGetNode(name: string): Promise<string> {
    this.ensureKubernetes();
    const node = await this.k8s!.getNode(name);

    const conditions = node.conditions.map(c =>
      `- **${c.type}**: ${c.status}${c.message ? ` (${c.message})` : ''}`
    ).join('\n');

    return this.formatMarkdown(`
# ☸️ Node: ${node.name}

**Status:** ${node.status === 'Ready' ? '✅' : '⚠️'} ${node.status}
**Roles:** ${node.roles.join(', ') || 'worker'}
**Version:** ${node.version}
**OS:** ${node.osImage}
**Architecture:** ${node.architecture}

## Capacity
- **CPU:** ${node.capacity.cpu}
- **Memory:** ${node.capacity.memory}
- **Pods:** ${node.capacity.pods}

## Allocatable
- **CPU:** ${node.allocatable.cpu}
- **Memory:** ${node.allocatable.memory}
- **Pods:** ${node.allocatable.pods}

## Conditions
${conditions}
    `);
  }

  private async k8sListNamespaces(): Promise<string> {
    this.ensureKubernetes();
    const result = await this.k8s!.listNamespaces();

    const rows = result.items.map(ns => {
      const status = ns.status === 'Active' ? '✅' : '⚠️';
      return `| ${status} | \`${ns.name}\` | ${ns.status} |`;
    }).join('\n');

    return this.formatMarkdown(`
# ☸️ Kubernetes Namespaces

| Status | Name | Status |
|--------|------|--------|
${rows}

**Total:** ${result.count} namespaces
    `);
  }

  private async k8sCreateNamespace(name: string): Promise<string> {
    this.ensureKubernetes();
    const result = await this.k8s!.createNamespace(name);
    return this.formatResult(result);
  }

  private async getInfo(): Promise<string> {
    let dockerInfo = 'Not connected';
    let k8sInfo = 'Not connected';

    if (this.docker) {
      try {
        const info = await this.docker.getInfo();
        dockerInfo = `✅ Connected (v${info.version})`;
      } catch {
        dockerInfo = '⚠️ Connection error';
      }
    }

    if (this.k8s) {
      try {
        const info = await this.k8s.getClusterInfo();
        k8sInfo = `✅ Connected (${info.version})`;
      } catch {
        k8sInfo = '⚠️ Connection error';
      }
    }

    return this.formatMarkdown(`
# 🚀 Infrastructure Pilot Status

**Docker:** ${dockerInfo}
**Kubernetes:** ${k8sInfo}

Use \`connect_docker\` or \`connect_kubernetes\` to connect to your infrastructure.
    `);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private formatMarkdown(text: string): string {
    return text.trim();
  }

  private formatResult(result: { success: boolean; message: string; error?: string }): string {
    if (result.success) {
      return this.formatMarkdown(`# ✅ Success\n\n${result.message}`);
    } else {
      return this.formatMarkdown(`# ❌ Error\n\n${result.message}\n\n\`\`\`\n${result.error}\n\`\`\``);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  private send(response: MCPResponse): void {
    console.log(JSON.stringify(response));
  }

  private sendError(id: string | number, code: number, message: string, data?: unknown): void {
    this.send({
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
        data,
      },
    });
  }
}

// Start the MCP server
new InfraPilotMCPServer();
