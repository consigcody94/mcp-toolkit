/**
 * Docker Client for Container Management
 * Wraps dockerode with enhanced error handling and convenience methods
 */

import Docker from 'dockerode';
import type {
  DockerConfig,
  ContainerInfo,
  ImageInfo,
  VolumeInfo,
  NetworkInfo,
  ContainerStats,
  ContainerCreateOptions,
  OperationResult,
} from '../types.js';

export class DockerClient {
  private docker: Docker;
  private connected: boolean = false;

  constructor(config: DockerConfig = {}) {
    this.docker = new Docker({
      socketPath: config.socketPath || '/var/run/docker.sock',
      host: config.host,
      port: config.port,
      ca: config.ca,
      cert: config.cert,
      key: config.key,
    });
  }

  /**
   * Test connection to Docker daemon
   */
  async connect(): Promise<void> {
    try {
      await this.docker.ping();
      this.connected = true;
    } catch (error) {
      throw new Error(`Failed to connect to Docker: ${(error as Error).message}`);
    }
  }

  /**
   * Check if connected to Docker daemon
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get Docker version and info
   */
  async getInfo(): Promise<{ version: string; info: any }> {
    const version = await this.docker.version();
    const info = await this.docker.info();
    return {
      version: version.Version || 'unknown',
      info,
    };
  }

  // ============================================================================
  // Container Operations
  // ============================================================================

  /**
   * List all containers
   */
  async listContainers(all = true): Promise<ContainerInfo[]> {
    const containers = await this.docker.listContainers({ all });

    return containers.map(c => ({
      id: c.Id.substring(0, 12),
      name: c.Names[0]?.replace(/^\//, '') || 'unknown',
      image: c.Image,
      status: c.Status,
      state: c.State,
      ports: c.Ports.map(p => ({
        privatePort: p.PrivatePort,
        publicPort: p.PublicPort,
        type: p.Type,
        ip: p.IP,
      })),
      created: new Date(c.Created * 1000),
      labels: c.Labels || {},
    }));
  }

  /**
   * Get container by name or ID
   */
  async getContainer(nameOrId: string): Promise<Docker.Container> {
    return this.docker.getContainer(nameOrId);
  }

  /**
   * Start a container
   */
  async startContainer(nameOrId: string): Promise<OperationResult> {
    const startTime = Date.now();
    try {
      const container = this.docker.getContainer(nameOrId);
      await container.start();
      return {
        success: true,
        message: `Container ${nameOrId} started successfully`,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to start container ${nameOrId}`,
        error: (error as Error).message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Stop a container
   */
  async stopContainer(nameOrId: string, timeout = 10): Promise<OperationResult> {
    const startTime = Date.now();
    try {
      const container = this.docker.getContainer(nameOrId);
      await container.stop({ t: timeout });
      return {
        success: true,
        message: `Container ${nameOrId} stopped successfully`,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to stop container ${nameOrId}`,
        error: (error as Error).message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Restart a container
   */
  async restartContainer(nameOrId: string, timeout = 10): Promise<OperationResult> {
    const startTime = Date.now();
    try {
      const container = this.docker.getContainer(nameOrId);
      await container.restart({ t: timeout });
      return {
        success: true,
        message: `Container ${nameOrId} restarted successfully`,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to restart container ${nameOrId}`,
        error: (error as Error).message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Remove a container
   */
  async removeContainer(nameOrId: string, force = false): Promise<OperationResult> {
    const startTime = Date.now();
    try {
      const container = this.docker.getContainer(nameOrId);
      await container.remove({ force });
      return {
        success: true,
        message: `Container ${nameOrId} removed successfully`,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to remove container ${nameOrId}`,
        error: (error as Error).message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Create a new container
   */
  async createContainer(options: ContainerCreateOptions): Promise<OperationResult> {
    const startTime = Date.now();
    try {
      const container = await this.docker.createContainer({
        name: options.name,
        Image: options.image,
        Cmd: options.cmd,
        Env: options.env,
        ExposedPorts: options.ports as any,
        HostConfig: {
          Binds: options.volumes,
          RestartPolicy: {
            Name: options.restart || 'no',
          },
        },
        Labels: options.labels,
      });

      return {
        success: true,
        message: `Container created successfully`,
        data: { id: await container.id, name: options.name },
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create container`,
        error: (error as Error).message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Get container logs
   */
  async getContainerLogs(
    nameOrId: string,
    tail = 100,
    _follow = false
  ): Promise<string> {
    const container = this.docker.getContainer(nameOrId);
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail,
      follow: false,
      timestamps: true,
    });

    return typeof logs === 'string' ? logs : logs.toString('utf-8');
  }

  /**
   * Execute command in container
   */
  async execContainer(
    nameOrId: string,
    cmd: string[]
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const container = this.docker.getContainer(nameOrId);

    const exec = await container.exec({
      Cmd: cmd,
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await exec.start({ hijack: true, stdin: false });

    let stdout = '';
    let stderr = '';

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => {
        const str = chunk.toString('utf-8');
        // Docker multiplexes stdout/stderr in a single stream
        // First byte indicates stream type (1=stdout, 2=stderr)
        if (chunk[0] === 1) {
          stdout += str.substring(8);
        } else if (chunk[0] === 2) {
          stderr += str.substring(8);
        } else {
          stdout += str;
        }
      });

      stream.on('end', async () => {
        const inspection = await exec.inspect();
        resolve({
          stdout,
          stderr,
          exitCode: inspection.ExitCode || 0,
        });
      });

      stream.on('error', reject);
    });
  }

  /**
   * Get container stats
   */
  async getContainerStats(nameOrId: string): Promise<ContainerStats> {
    const container = this.docker.getContainer(nameOrId);
    const stats = await container.stats({ stream: false });

    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage -
                     (stats.precpu_stats.cpu_usage?.total_usage || 0);
    const systemDelta = stats.cpu_stats.system_cpu_usage -
                        (stats.precpu_stats.system_cpu_usage || 0);
    const cpuPercentage = (cpuDelta / systemDelta) *
                          (stats.cpu_stats.online_cpus || 1) * 100;

    const memoryUsage = stats.memory_stats.usage || 0;
    const memoryLimit = stats.memory_stats.limit || 1;
    const memoryPercentage = (memoryUsage / memoryLimit) * 100;

    return {
      cpu: {
        usage: cpuDelta,
        percentage: cpuPercentage,
      },
      memory: {
        usage: memoryUsage,
        limit: memoryLimit,
        percentage: memoryPercentage,
      },
      network: {
        rx: Object.values(stats.networks || {}).reduce((sum: number, net: any) =>
          sum + (net.rx_bytes || 0), 0),
        tx: Object.values(stats.networks || {}).reduce((sum: number, net: any) =>
          sum + (net.tx_bytes || 0), 0),
      },
      blockIO: {
        read: stats.blkio_stats?.io_service_bytes_recursive?.reduce((sum: number, io: any) =>
          io.op === 'Read' ? sum + io.value : sum, 0) || 0,
        write: stats.blkio_stats?.io_service_bytes_recursive?.reduce((sum: number, io: any) =>
          io.op === 'Write' ? sum + io.value : sum, 0) || 0,
      },
    };
  }

  // ============================================================================
  // Image Operations
  // ============================================================================

  /**
   * List all images
   */
  async listImages(): Promise<ImageInfo[]> {
    const images = await this.docker.listImages();

    return images.map(img => ({
      id: img.Id.replace('sha256:', '').substring(0, 12),
      repoTags: img.RepoTags || ['<none>:<none>'],
      size: img.Size,
      created: new Date(img.Created * 1000),
      labels: img.Labels || {},
    }));
  }

  /**
   * Pull an image
   */
  async pullImage(imageName: string): Promise<OperationResult> {
    const startTime = Date.now();
    try {
      await new Promise((resolve, reject) => {
        this.docker.pull(imageName, (err: Error | null, stream: NodeJS.ReadableStream) => {
          if (err) {
            reject(err);
            return;
          }

          this.docker.modem.followProgress(stream, (err: Error | null) => {
            if (err) reject(err);
            else resolve(undefined);
          });
        });
      });

      return {
        success: true,
        message: `Image ${imageName} pulled successfully`,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to pull image ${imageName}`,
        error: (error as Error).message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Remove an image
   */
  async removeImage(nameOrId: string, force = false): Promise<OperationResult> {
    const startTime = Date.now();
    try {
      const image = this.docker.getImage(nameOrId);
      await image.remove({ force });
      return {
        success: true,
        message: `Image ${nameOrId} removed successfully`,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to remove image ${nameOrId}`,
        error: (error as Error).message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // Volume Operations
  // ============================================================================

  /**
   * List all volumes
   */
  async listVolumes(): Promise<VolumeInfo[]> {
    const result = await this.docker.listVolumes();

    return (result.Volumes || []).map(vol => ({
      name: vol.Name,
      driver: vol.Driver,
      mountpoint: vol.Mountpoint,
      labels: vol.Labels || {},
      scope: vol.Scope,
    }));
  }

  /**
   * Create a volume
   */
  async createVolume(name: string, driver = 'local'): Promise<OperationResult> {
    const startTime = Date.now();
    try {
      await this.docker.createVolume({ Name: name, Driver: driver });
      return {
        success: true,
        message: `Volume ${name} created successfully`,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create volume ${name}`,
        error: (error as Error).message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Remove a volume
   */
  async removeVolume(name: string, force = false): Promise<OperationResult> {
    const startTime = Date.now();
    try {
      const volume = this.docker.getVolume(name);
      await volume.remove({ force });
      return {
        success: true,
        message: `Volume ${name} removed successfully`,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to remove volume ${name}`,
        error: (error as Error).message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // Network Operations
  // ============================================================================

  /**
   * List all networks
   */
  async listNetworks(): Promise<NetworkInfo[]> {
    const networks = await this.docker.listNetworks();

    return networks.map(net => ({
      id: net.Id.substring(0, 12),
      name: net.Name,
      driver: net.Driver,
      scope: net.Scope,
      containers: net.Containers || {},
    }));
  }

  /**
   * Create a network
   */
  async createNetwork(name: string, driver = 'bridge'): Promise<OperationResult> {
    const startTime = Date.now();
    try {
      await this.docker.createNetwork({ Name: name, Driver: driver });
      return {
        success: true,
        message: `Network ${name} created successfully`,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create network ${name}`,
        error: (error as Error).message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Remove a network
   */
  async removeNetwork(nameOrId: string): Promise<OperationResult> {
    const startTime = Date.now();
    try {
      const network = this.docker.getNetwork(nameOrId);
      await network.remove();
      return {
        success: true,
        message: `Network ${nameOrId} removed successfully`,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to remove network ${nameOrId}`,
        error: (error as Error).message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Prune unused resources
   */
  async prune(type: 'containers' | 'images' | 'volumes' | 'networks'): Promise<OperationResult> {
    const startTime = Date.now();
    try {
      let result;
      switch (type) {
        case 'containers':
          result = await this.docker.pruneContainers();
          break;
        case 'images':
          result = await this.docker.pruneImages();
          break;
        case 'volumes':
          result = await this.docker.pruneVolumes();
          break;
        case 'networks':
          result = await this.docker.pruneNetworks();
          break;
      }

      return {
        success: true,
        message: `Pruned unused ${type} successfully`,
        data: result,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to prune ${type}`,
        error: (error as Error).message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }
}
