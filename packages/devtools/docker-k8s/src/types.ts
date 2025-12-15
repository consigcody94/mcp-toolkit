/**
 * Type definitions for Infrastructure Pilot MCP Server
 * Comprehensive type system for Docker and Kubernetes operations
 */

// ============================================================================
// MCP Protocol Types
// ============================================================================

export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: MCPParams;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

export interface MCPParams {
  name?: string;
  arguments?: Record<string, unknown>;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// ============================================================================
// Docker Types
// ============================================================================

export interface DockerConfig {
  socketPath?: string;
  host?: string;
  port?: number;
  ca?: string;
  cert?: string;
  key?: string;
}

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  ports: PortMapping[];
  created: Date;
  labels: Record<string, string>;
}

export interface PortMapping {
  privatePort: number;
  publicPort?: number;
  type: string;
  ip?: string;
}

export interface ImageInfo {
  id: string;
  repoTags: string[];
  size: number;
  created: Date;
  labels: Record<string, string>;
}

export interface VolumeInfo {
  name: string;
  driver: string;
  mountpoint: string;
  labels: Record<string, string>;
  scope: string;
}

export interface NetworkInfo {
  id: string;
  name: string;
  driver: string;
  scope: string;
  containers: Record<string, unknown>;
}

export interface ContainerStats {
  cpu: {
    usage: number;
    percentage: number;
  };
  memory: {
    usage: number;
    limit: number;
    percentage: number;
  };
  network: {
    rx: number;
    tx: number;
  };
  blockIO: {
    read: number;
    write: number;
  };
}

export interface ContainerCreateOptions {
  name?: string;
  image: string;
  cmd?: string[];
  env?: string[];
  ports?: Record<string, unknown>;
  volumes?: string[];
  restart?: string;
  labels?: Record<string, string>;
}

export interface ComposeProject {
  name: string;
  services: ComposeService[];
  networks: string[];
  volumes: string[];
}

export interface ComposeService {
  name: string;
  image: string;
  status: string;
  ports: string[];
}

// ============================================================================
// Kubernetes Types
// ============================================================================

export interface K8sConfig {
  kubeconfig?: string;
  context?: string;
  cluster?: string;
  namespace?: string;
}

export interface PodInfo {
  name: string;
  namespace: string;
  status: string;
  phase: string;
  ip: string;
  node: string;
  containers: ContainerStatus[];
  created: Date;
  labels: Record<string, string>;
}

export interface ContainerStatus {
  name: string;
  image: string;
  ready: boolean;
  restartCount: number;
  state: string;
}

export interface DeploymentInfo {
  name: string;
  namespace: string;
  replicas: {
    desired: number;
    current: number;
    ready: number;
    available: number;
  };
  strategy: string;
  created: Date;
  labels: Record<string, string>;
}

export interface ServiceInfo {
  name: string;
  namespace: string;
  type: string;
  clusterIP: string;
  externalIPs: string[];
  ports: ServicePort[];
  selector: Record<string, string>;
}

export interface ServicePort {
  name: string;
  port: number;
  targetPort: number | string;
  protocol: string;
  nodePort?: number;
}

export interface NamespaceInfo {
  name: string;
  status: string;
  created: Date;
  labels: Record<string, string>;
}

export interface NodeInfo {
  name: string;
  status: string;
  roles: string[];
  version: string;
  osImage: string;
  architecture: string;
  capacity: {
    cpu: string;
    memory: string;
    pods: string;
  };
  allocatable: {
    cpu: string;
    memory: string;
    pods: string;
  };
  conditions: NodeCondition[];
}

export interface NodeCondition {
  type: string;
  status: string;
  reason?: string;
  message?: string;
}

export interface IngressInfo {
  name: string;
  namespace: string;
  hosts: string[];
  addresses: string[];
  rules: IngressRule[];
}

export interface IngressRule {
  host: string;
  paths: IngressPath[];
}

export interface IngressPath {
  path: string;
  pathType: string;
  backend: {
    serviceName: string;
    servicePort: number | string;
  };
}

export interface ConfigMapInfo {
  name: string;
  namespace: string;
  data: Record<string, string>;
  created: Date;
}

export interface SecretInfo {
  name: string;
  namespace: string;
  type: string;
  dataKeys: string[];
  created: Date;
}

export interface PodMetrics {
  name: string;
  namespace: string;
  containers: ContainerMetrics[];
  timestamp: Date;
}

export interface ContainerMetrics {
  name: string;
  cpu: string;
  memory: string;
}

// ============================================================================
// Operation Result Types
// ============================================================================

export interface OperationResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
  executionTimeMs: number;
}

export interface ResourceList<T> {
  items: T[];
  count: number;
  namespace?: string;
}

export interface LogsResult {
  containerName: string;
  logs: string;
  tail?: number;
  since?: string;
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

// ============================================================================
// Query Types
// ============================================================================

export interface ContainerQuery {
  all?: boolean;
  filters?: Record<string, string[]>;
  limit?: number;
}

export interface PodQuery {
  namespace?: string;
  labelSelector?: string;
  fieldSelector?: string;
  limit?: number;
}

export interface DeploymentQuery {
  namespace?: string;
  labelSelector?: string;
  limit?: number;
}

// ============================================================================
// Natural Language Types
// ============================================================================

export interface NaturalLanguageRequest {
  prompt: string;
  context?: {
    platform?: 'docker' | 'kubernetes';
    namespace?: string;
    filters?: Record<string, string>;
  };
}

export interface ParsedIntent {
  platform: 'docker' | 'kubernetes' | 'both';
  action: InfraAction;
  target: string;
  parameters: Record<string, string | number | boolean>;
  confidence: number;
}

export type InfraAction =
  // Docker actions
  | 'list_containers'
  | 'start_container'
  | 'stop_container'
  | 'restart_container'
  | 'remove_container'
  | 'create_container'
  | 'inspect_container'
  | 'logs_container'
  | 'exec_container'
  | 'stats_container'
  | 'list_images'
  | 'pull_image'
  | 'build_image'
  | 'remove_image'
  | 'list_volumes'
  | 'create_volume'
  | 'remove_volume'
  | 'list_networks'
  | 'create_network'
  | 'remove_network'
  | 'compose_up'
  | 'compose_down'
  | 'compose_logs'
  // Kubernetes actions
  | 'list_pods'
  | 'get_pod'
  | 'delete_pod'
  | 'logs_pod'
  | 'exec_pod'
  | 'list_deployments'
  | 'get_deployment'
  | 'scale_deployment'
  | 'restart_deployment'
  | 'delete_deployment'
  | 'list_services'
  | 'get_service'
  | 'delete_service'
  | 'list_nodes'
  | 'get_node'
  | 'drain_node'
  | 'cordon_node'
  | 'uncordon_node'
  | 'list_namespaces'
  | 'create_namespace'
  | 'delete_namespace'
  | 'get_events'
  | 'apply_yaml'
  | 'delete_yaml'
  // Common
  | 'help'
  | 'other';

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
