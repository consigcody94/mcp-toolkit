/**
 * Kubernetes Client for Cluster Management
 * Wraps @kubernetes/client-node with enhanced error handling
 */

import * as k8s from '@kubernetes/client-node';
import type {
  K8sConfig,
  PodInfo,
  DeploymentInfo,
  ServiceInfo,
  NodeInfo,
  NamespaceInfo,
  OperationResult,
  ResourceList,
} from '../types.js';

export class KubernetesClient {
  private kc: k8s.KubeConfig;
  private coreApi: k8s.CoreV1Api;
  private appsApi: k8s.AppsV1Api;
  private connected: boolean = false;
  private currentNamespace: string = 'default';

  constructor(config: K8sConfig = {}) {
    this.kc = new k8s.KubeConfig();

    if (config.kubeconfig) {
      this.kc.loadFromFile(config.kubeconfig);
    } else {
      try {
        this.kc.loadFromDefault();
      } catch {
        this.kc.loadFromCluster();
      }
    }

    if (config.context) {
      this.kc.setCurrentContext(config.context);
    }

    if (config.namespace) {
      this.currentNamespace = config.namespace;
    }

    this.coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
    this.appsApi = this.kc.makeApiClient(k8s.AppsV1Api);
  }

  /**
   * Test connection to Kubernetes cluster
   */
  async connect(): Promise<void> {
    try {
      await this.coreApi.listNamespace();
      this.connected = true;
    } catch (error) {
      throw new Error(
        `Failed to connect to Kubernetes: ${(error as Error).message}`
      );
    }
  }

  /**
   * Check if connected to cluster
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get cluster info
   */
  async getClusterInfo(): Promise<{
    version: string;
    currentContext: string;
    namespace: string;
  }> {
    const versionInfo = await this.kc.makeApiClient(k8s.VersionApi).getCode();

    return {
      version: versionInfo.body.gitVersion || 'unknown',
      currentContext: this.kc.getCurrentContext(),
      namespace: this.currentNamespace,
    };
  }

  /**
   * Set current namespace
   */
  setNamespace(namespace: string): void {
    this.currentNamespace = namespace;
  }

  // ============================================================================
  // Pod Operations
  // ============================================================================

  /**
   * List pods in namespace
   */
  async listPods(namespace?: string): Promise<ResourceList<PodInfo>> {
    const ns = namespace || this.currentNamespace;
    const response = await this.coreApi.listNamespacedPod(ns);

    const pods: PodInfo[] = response.body.items.map(pod => ({
      name: pod.metadata?.name || 'unknown',
      namespace: pod.metadata?.namespace || ns,
      status: pod.status?.phase || 'Unknown',
      phase: pod.status?.phase || 'Unknown',
      ip: pod.status?.podIP || '',
      node: pod.spec?.nodeName || '',
      containers: (pod.status?.containerStatuses || []).map(cs => ({
        name: cs.name,
        image: cs.image,
        ready: cs.ready,
        restartCount: cs.restartCount,
        state: Object.keys(cs.state || {})[0] || 'unknown',
      })),
      created: new Date(pod.metadata?.creationTimestamp || Date.now()),
      labels: pod.metadata?.labels || {},
    }));

    return {
      items: pods,
      count: pods.length,
      namespace: ns,
    };
  }

  /**
   * Get a specific pod
   */
  async getPod(name: string, namespace?: string): Promise<PodInfo> {
    const ns = namespace || this.currentNamespace;
    const response = await this.coreApi.readNamespacedPod(name, ns);
    const pod = response.body;

    return {
      name: pod.metadata?.name || name,
      namespace: pod.metadata?.namespace || ns,
      status: pod.status?.phase || 'Unknown',
      phase: pod.status?.phase || 'Unknown',
      ip: pod.status?.podIP || '',
      node: pod.spec?.nodeName || '',
      containers: (pod.status?.containerStatuses || []).map(cs => ({
        name: cs.name,
        image: cs.image,
        ready: cs.ready,
        restartCount: cs.restartCount,
        state: Object.keys(cs.state || {})[0] || 'unknown',
      })),
      created: new Date(pod.metadata?.creationTimestamp || Date.now()),
      labels: pod.metadata?.labels || {},
    };
  }

  /**
   * Delete a pod
   */
  async deletePod(name: string, namespace?: string): Promise<OperationResult> {
    const startTime = Date.now();
    const ns = namespace || this.currentNamespace;

    try {
      await this.coreApi.deleteNamespacedPod(name, ns);
      return {
        success: true,
        message: `Pod ${name} in namespace ${ns} deleted successfully`,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete pod ${name}`,
        error: (error as Error).message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Get pod logs
   */
  async getPodLogs(
    name: string,
    namespace?: string,
    container?: string,
    tail = 100
  ): Promise<string> {
    const ns = namespace || this.currentNamespace;
    const response = await this.coreApi.readNamespacedPodLog(
      name,
      ns,
      container,
      false,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      tail,
      undefined
    );

    return response.body;
  }

  /**
   * Execute command in pod
   */
  async execPod(
    name: string,
    command: string[],
    namespace?: string,
    _container?: string
  ): Promise<{ stdout: string; stderr: string }> {
    const ns = namespace || this.currentNamespace;

    // Note: Exec implementation simplified for type safety
    // Full implementation would stream to/from process stdio
    const stdout = '';
    const stderr = '';

    // TODO: Implement proper exec with stream handling
    console.log(`Exec pod ${name} in namespace ${ns} with command:`, command);

    return { stdout, stderr };
  }

  // ============================================================================
  // Deployment Operations
  // ============================================================================

  /**
   * List deployments in namespace
   */
  async listDeployments(namespace?: string): Promise<ResourceList<DeploymentInfo>> {
    const ns = namespace || this.currentNamespace;
    const response = await this.appsApi.listNamespacedDeployment(ns);

    const deployments: DeploymentInfo[] = response.body.items.map(dep => ({
      name: dep.metadata?.name || 'unknown',
      namespace: dep.metadata?.namespace || ns,
      replicas: {
        desired: dep.spec?.replicas || 0,
        current: dep.status?.replicas || 0,
        ready: dep.status?.readyReplicas || 0,
        available: dep.status?.availableReplicas || 0,
      },
      strategy: dep.spec?.strategy?.type || 'RollingUpdate',
      created: new Date(dep.metadata?.creationTimestamp || Date.now()),
      labels: dep.metadata?.labels || {},
    }));

    return {
      items: deployments,
      count: deployments.length,
      namespace: ns,
    };
  }

  /**
   * Get a specific deployment
   */
  async getDeployment(name: string, namespace?: string): Promise<DeploymentInfo> {
    const ns = namespace || this.currentNamespace;
    const response = await this.appsApi.readNamespacedDeployment(name, ns);
    const dep = response.body;

    return {
      name: dep.metadata?.name || name,
      namespace: dep.metadata?.namespace || ns,
      replicas: {
        desired: dep.spec?.replicas || 0,
        current: dep.status?.replicas || 0,
        ready: dep.status?.readyReplicas || 0,
        available: dep.status?.availableReplicas || 0,
      },
      strategy: dep.spec?.strategy?.type || 'RollingUpdate',
      created: new Date(dep.metadata?.creationTimestamp || Date.now()),
      labels: dep.metadata?.labels || {},
    };
  }

  /**
   * Scale a deployment
   */
  async scaleDeployment(
    name: string,
    replicas: number,
    namespace?: string
  ): Promise<OperationResult> {
    const startTime = Date.now();
    const ns = namespace || this.currentNamespace;

    try {
      const patch = {
        spec: {
          replicas,
        },
      };

      await this.appsApi.patchNamespacedDeployment(
        name,
        ns,
        patch,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          headers: { 'Content-Type': 'application/strategic-merge-patch+json' },
        }
      );

      return {
        success: true,
        message: `Deployment ${name} scaled to ${replicas} replicas`,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to scale deployment ${name}`,
        error: (error as Error).message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Restart a deployment (rolling restart)
   */
  async restartDeployment(name: string, namespace?: string): Promise<OperationResult> {
    const startTime = Date.now();
    const ns = namespace || this.currentNamespace;

    try {
      const patch = {
        spec: {
          template: {
            metadata: {
              annotations: {
                'kubectl.kubernetes.io/restartedAt': new Date().toISOString(),
              },
            },
          },
        },
      };

      await this.appsApi.patchNamespacedDeployment(
        name,
        ns,
        patch,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          headers: { 'Content-Type': 'application/strategic-merge-patch+json' },
        }
      );

      return {
        success: true,
        message: `Deployment ${name} restarting`,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to restart deployment ${name}`,
        error: (error as Error).message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Delete a deployment
   */
  async deleteDeployment(name: string, namespace?: string): Promise<OperationResult> {
    const startTime = Date.now();
    const ns = namespace || this.currentNamespace;

    try {
      await this.appsApi.deleteNamespacedDeployment(name, ns);
      return {
        success: true,
        message: `Deployment ${name} deleted successfully`,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete deployment ${name}`,
        error: (error as Error).message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // Service Operations
  // ============================================================================

  /**
   * List services in namespace
   */
  async listServices(namespace?: string): Promise<ResourceList<ServiceInfo>> {
    const ns = namespace || this.currentNamespace;
    const response = await this.coreApi.listNamespacedService(ns);

    const services: ServiceInfo[] = response.body.items.map(svc => ({
      name: svc.metadata?.name || 'unknown',
      namespace: svc.metadata?.namespace || ns,
      type: svc.spec?.type || 'ClusterIP',
      clusterIP: svc.spec?.clusterIP || '',
      externalIPs: svc.spec?.externalIPs || [],
      ports: (svc.spec?.ports || []).map(p => ({
        name: p.name || '',
        port: p.port,
        targetPort: p.targetPort as number | string,
        protocol: p.protocol || 'TCP',
        nodePort: p.nodePort,
      })),
      selector: svc.spec?.selector || {},
    }));

    return {
      items: services,
      count: services.length,
      namespace: ns,
    };
  }

  /**
   * Get a specific service
   */
  async getService(name: string, namespace?: string): Promise<ServiceInfo> {
    const ns = namespace || this.currentNamespace;
    const response = await this.coreApi.readNamespacedService(name, ns);
    const svc = response.body;

    return {
      name: svc.metadata?.name || name,
      namespace: svc.metadata?.namespace || ns,
      type: svc.spec?.type || 'ClusterIP',
      clusterIP: svc.spec?.clusterIP || '',
      externalIPs: svc.spec?.externalIPs || [],
      ports: (svc.spec?.ports || []).map(p => ({
        name: p.name || '',
        port: p.port,
        targetPort: p.targetPort as number | string,
        protocol: p.protocol || 'TCP',
        nodePort: p.nodePort,
      })),
      selector: svc.spec?.selector || {},
    };
  }

  /**
   * Delete a service
   */
  async deleteService(name: string, namespace?: string): Promise<OperationResult> {
    const startTime = Date.now();
    const ns = namespace || this.currentNamespace;

    try {
      await this.coreApi.deleteNamespacedService(name, ns);
      return {
        success: true,
        message: `Service ${name} deleted successfully`,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete service ${name}`,
        error: (error as Error).message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // Node Operations
  // ============================================================================

  /**
   * List cluster nodes
   */
  async listNodes(): Promise<ResourceList<NodeInfo>> {
    const response = await this.coreApi.listNode();

    const nodes: NodeInfo[] = response.body.items.map(node => ({
      name: node.metadata?.name || 'unknown',
      status: node.status?.conditions?.find(c => c.type === 'Ready')?.status === 'True'
        ? 'Ready'
        : 'NotReady',
      roles: Object.keys(node.metadata?.labels || {})
        .filter(k => k.startsWith('node-role.kubernetes.io/'))
        .map(k => k.replace('node-role.kubernetes.io/', '')),
      version: node.status?.nodeInfo?.kubeletVersion || 'unknown',
      osImage: node.status?.nodeInfo?.osImage || 'unknown',
      architecture: node.status?.nodeInfo?.architecture || 'unknown',
      capacity: {
        cpu: node.status?.capacity?.cpu || '0',
        memory: node.status?.capacity?.memory || '0',
        pods: node.status?.capacity?.pods || '0',
      },
      allocatable: {
        cpu: node.status?.allocatable?.cpu || '0',
        memory: node.status?.allocatable?.memory || '0',
        pods: node.status?.allocatable?.pods || '0',
      },
      conditions: (node.status?.conditions || []).map(c => ({
        type: c.type,
        status: c.status,
        reason: c.reason,
        message: c.message,
      })),
    }));

    return {
      items: nodes,
      count: nodes.length,
    };
  }

  /**
   * Get a specific node
   */
  async getNode(name: string): Promise<NodeInfo> {
    const response = await this.coreApi.readNode(name);
    const node = response.body;

    return {
      name: node.metadata?.name || name,
      status: node.status?.conditions?.find(c => c.type === 'Ready')?.status === 'True'
        ? 'Ready'
        : 'NotReady',
      roles: Object.keys(node.metadata?.labels || {})
        .filter(k => k.startsWith('node-role.kubernetes.io/'))
        .map(k => k.replace('node-role.kubernetes.io/', '')),
      version: node.status?.nodeInfo?.kubeletVersion || 'unknown',
      osImage: node.status?.nodeInfo?.osImage || 'unknown',
      architecture: node.status?.nodeInfo?.architecture || 'unknown',
      capacity: {
        cpu: node.status?.capacity?.cpu || '0',
        memory: node.status?.capacity?.memory || '0',
        pods: node.status?.capacity?.pods || '0',
      },
      allocatable: {
        cpu: node.status?.allocatable?.cpu || '0',
        memory: node.status?.allocatable?.memory || '0',
        pods: node.status?.allocatable?.pods || '0',
      },
      conditions: (node.status?.conditions || []).map(c => ({
        type: c.type,
        status: c.status,
        reason: c.reason,
        message: c.message,
      })),
    };
  }

  // ============================================================================
  // Namespace Operations
  // ============================================================================

  /**
   * List all namespaces
   */
  async listNamespaces(): Promise<ResourceList<NamespaceInfo>> {
    const response = await this.coreApi.listNamespace();

    const namespaces: NamespaceInfo[] = response.body.items.map(ns => ({
      name: ns.metadata?.name || 'unknown',
      status: ns.status?.phase || 'Active',
      created: new Date(ns.metadata?.creationTimestamp || Date.now()),
      labels: ns.metadata?.labels || {},
    }));

    return {
      items: namespaces,
      count: namespaces.length,
    };
  }

  /**
   * Create a namespace
   */
  async createNamespace(name: string): Promise<OperationResult> {
    const startTime = Date.now();

    try {
      await this.coreApi.createNamespace({
        metadata: {
          name,
        },
      });

      return {
        success: true,
        message: `Namespace ${name} created successfully`,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create namespace ${name}`,
        error: (error as Error).message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Delete a namespace
   */
  async deleteNamespace(name: string): Promise<OperationResult> {
    const startTime = Date.now();

    try {
      await this.coreApi.deleteNamespace(name);
      return {
        success: true,
        message: `Namespace ${name} deleted successfully`,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete namespace ${name}`,
        error: (error as Error).message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Get cluster events
   */
  async getEvents(namespace?: string, limit = 100): Promise<string[]> {
    const ns = namespace || this.currentNamespace;
    const response = await this.coreApi.listNamespacedEvent(ns);

    return response.body.items
      .slice(0, limit)
      .map(event => {
        const time = event.lastTimestamp || event.firstTimestamp || new Date();
        return `[${time}] ${event.type}: ${event.reason} - ${event.message}`;
      });
  }
}
