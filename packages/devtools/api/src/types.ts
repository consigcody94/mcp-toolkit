/**
 * Type system for API Pilot - API Mocking and Exploration
 */

// ============================================================================
// HTTP Types
// ============================================================================

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface HTTPHeaders {
  [key: string]: string;
}

export interface HTTPRequest {
  method: HTTPMethod;
  url: string;
  headers?: HTTPHeaders;
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

export interface HTTPResponse {
  status: number;
  statusText: string;
  headers: HTTPHeaders;
  body: unknown;
  duration: number;
}

// ============================================================================
// Mock Server Types
// ============================================================================

export interface MockRoute {
  id: string;
  method: HTTPMethod;
  path: string;
  response: {
    status: number;
    headers?: HTTPHeaders;
    body: unknown;
    delay?: number;
  };
  enabled: boolean;
  description?: string;
}

export interface MockServer {
  id: string;
  name: string;
  port: number;
  baseUrl: string;
  routes: MockRoute[];
  running: boolean;
}

export interface MockServerConfig {
  port?: number;
  baseUrl?: string;
  name?: string;
}

// ============================================================================
// API Collection Types
// ============================================================================

export interface APIRequest {
  id: string;
  name: string;
  method: HTTPMethod;
  url: string;
  headers?: HTTPHeaders;
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, string>;
  auth?: {
    type: 'bearer' | 'basic' | 'api-key';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyHeader?: string;
  };
  description?: string;
}

export interface APICollection {
  id: string;
  name: string;
  description?: string;
  baseUrl?: string;
  requests: APIRequest[];
  variables?: Record<string, string>;
}

// ============================================================================
// OpenAPI/Swagger Types
// ============================================================================

export interface OpenAPIInfo {
  title: string;
  version: string;
  description?: string;
  termsOfService?: string;
  contact?: {
    name?: string;
    url?: string;
    email?: string;
  };
  license?: {
    name: string;
    url?: string;
  };
}

export interface OpenAPIServer {
  url: string;
  description?: string;
  variables?: Record<string, { default: string; enum?: string[]; description?: string }>;
}

export interface OpenAPIPath {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: Array<{
    name: string;
    in: 'query' | 'header' | 'path' | 'cookie';
    description?: string;
    required?: boolean;
    schema?: unknown;
  }>;
  requestBody?: {
    description?: string;
    required?: boolean;
    content?: Record<string, unknown>;
  };
  responses?: Record<
    string,
    {
      description?: string;
      content?: Record<string, unknown>;
    }
  >;
}

export interface OpenAPISpec {
  openapi: string;
  info: OpenAPIInfo;
  servers?: OpenAPIServer[];
  paths: Record<string, Record<string, unknown>>;
  components?: {
    schemas?: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
  };
}

// ============================================================================
// Request Recording Types
// ============================================================================

export interface RecordedRequest {
  id: string;
  timestamp: Date;
  request: HTTPRequest;
  response?: HTTPResponse;
  error?: string;
}

export interface RequestRecording {
  id: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  requests: RecordedRequest[];
  baseUrl?: string;
}

// ============================================================================
// MCP Types
// ============================================================================

export interface MCPRequest {
  method: string;
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
  };
}

export interface MCPResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
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
// Operation Results
// ============================================================================

export interface OperationResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}
