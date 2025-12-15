/**
 * MCP Server for API Pilot
 */

import { MockAPIServer } from './mock-server.js';
import { APIClient } from './api-client.js';
import { OpenAPIParser } from './openapi-parser.js';
import type {
  MCPRequest,
  MCPResponse,
  MCPTool,
  HTTPMethod,
  HTTPRequest,
} from './types.js';

export class APIPilotMCPServer {
  private mockServer: MockAPIServer;
  private apiClient: APIClient;
  private openApiParser: OpenAPIParser;

  constructor() {
    this.mockServer = new MockAPIServer();
    this.apiClient = new APIClient();
    this.openApiParser = new OpenAPIParser();
  }

  /**
   * List all available MCP tools
   */
  listTools(): MCPTool[] {
    return [
      // Mock Server Tools
      {
        name: 'create_mock_server',
        description: 'Create a new mock API server',
        inputSchema: {
          type: 'object',
          properties: {
            port: {
              type: 'number',
              description: 'Port to run the server on (default: 3000)',
            },
            name: {
              type: 'string',
              description: 'Name for the mock server',
            },
          },
        },
      },
      {
        name: 'add_mock_route',
        description: 'Add a route to a mock server',
        inputSchema: {
          type: 'object',
          properties: {
            serverId: {
              type: 'string',
              description: 'ID of the mock server',
            },
            method: {
              type: 'string',
              description: 'HTTP method (GET, POST, PUT, PATCH, DELETE)',
            },
            path: {
              type: 'string',
              description: 'Route path (e.g., /api/users)',
            },
            status: {
              type: 'number',
              description: 'HTTP status code (default: 200)',
            },
            body: {
              type: 'object',
              description: 'Response body',
            },
            delay: {
              type: 'number',
              description: 'Response delay in milliseconds (optional)',
            },
            description: {
              type: 'string',
              description: 'Route description',
            },
          },
          required: ['serverId', 'method', 'path'],
        },
      },
      {
        name: 'start_mock_server',
        description: 'Start a mock server',
        inputSchema: {
          type: 'object',
          properties: {
            serverId: {
              type: 'string',
              description: 'ID of the mock server',
            },
          },
          required: ['serverId'],
        },
      },
      {
        name: 'stop_mock_server',
        description: 'Stop a running mock server',
        inputSchema: {
          type: 'object',
          properties: {
            serverId: {
              type: 'string',
              description: 'ID of the mock server',
            },
          },
          required: ['serverId'],
        },
      },
      {
        name: 'list_mock_servers',
        description: 'List all mock servers',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },

      // API Client Tools
      {
        name: 'make_http_request',
        description: 'Make an HTTP request to any API',
        inputSchema: {
          type: 'object',
          properties: {
            method: {
              type: 'string',
              description: 'HTTP method (GET, POST, PUT, PATCH, DELETE)',
            },
            url: {
              type: 'string',
              description: 'Full URL to make the request to',
            },
            headers: {
              type: 'object',
              description: 'HTTP headers',
            },
            body: {
              type: 'object',
              description: 'Request body (for POST, PUT, PATCH)',
            },
            query: {
              type: 'object',
              description: 'Query parameters',
            },
          },
          required: ['method', 'url'],
        },
      },
      {
        name: 'create_collection',
        description: 'Create a new API request collection',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Collection name',
            },
            description: {
              type: 'string',
              description: 'Collection description',
            },
            baseUrl: {
              type: 'string',
              description: 'Base URL for all requests in the collection',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'add_request_to_collection',
        description: 'Add a request to a collection',
        inputSchema: {
          type: 'object',
          properties: {
            collectionId: {
              type: 'string',
              description: 'ID of the collection',
            },
            name: {
              type: 'string',
              description: 'Request name',
            },
            method: {
              type: 'string',
              description: 'HTTP method',
            },
            url: {
              type: 'string',
              description: 'Request URL (can use {{variables}})',
            },
            headers: {
              type: 'object',
              description: 'HTTP headers',
            },
            body: {
              type: 'object',
              description: 'Request body',
            },
            description: {
              type: 'string',
              description: 'Request description',
            },
          },
          required: ['collectionId', 'name', 'method', 'url'],
        },
      },
      {
        name: 'execute_collection_request',
        description: 'Execute a request from a collection',
        inputSchema: {
          type: 'object',
          properties: {
            collectionId: {
              type: 'string',
              description: 'ID of the collection',
            },
            requestId: {
              type: 'string',
              description: 'ID of the request',
            },
          },
          required: ['collectionId', 'requestId'],
        },
      },
      {
        name: 'list_collections',
        description: 'List all API collections',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'set_collection_variable',
        description: 'Set a variable in a collection',
        inputSchema: {
          type: 'object',
          properties: {
            collectionId: {
              type: 'string',
              description: 'ID of the collection',
            },
            key: {
              type: 'string',
              description: 'Variable name',
            },
            value: {
              type: 'string',
              description: 'Variable value',
            },
          },
          required: ['collectionId', 'key', 'value'],
        },
      },

      // OpenAPI Tools
      {
        name: 'parse_openapi_spec',
        description: 'Parse an OpenAPI/Swagger specification',
        inputSchema: {
          type: 'object',
          properties: {
            source: {
              type: 'string',
              description: 'URL or file path to OpenAPI spec',
            },
          },
          required: ['source'],
        },
      },
      {
        name: 'list_api_endpoints',
        description: 'List all endpoints from a parsed OpenAPI spec',
        inputSchema: {
          type: 'object',
          properties: {
            specId: {
              type: 'string',
              description: 'ID of the parsed spec',
            },
          },
          required: ['specId'],
        },
      },
      {
        name: 'get_endpoint_details',
        description: 'Get details about a specific endpoint',
        inputSchema: {
          type: 'object',
          properties: {
            specId: {
              type: 'string',
              description: 'ID of the parsed spec',
            },
            method: {
              type: 'string',
              description: 'HTTP method',
            },
            path: {
              type: 'string',
              description: 'Endpoint path',
            },
          },
          required: ['specId', 'method', 'path'],
        },
      },
      {
        name: 'get_api_schemas',
        description: 'Get all schemas from an OpenAPI spec',
        inputSchema: {
          type: 'object',
          properties: {
            specId: {
              type: 'string',
              description: 'ID of the parsed spec',
            },
          },
          required: ['specId'],
        },
      },
    ];
  }

  /**
   * Call an MCP tool
   */
  async callTool(request: MCPRequest): Promise<MCPResponse> {
    const toolName = request.params?.name;
    const args = request.params?.arguments || {};

    try {
      switch (toolName) {
        // Mock Server Tools
        case 'create_mock_server':
          return await this.handleCreateMockServer(args);
        case 'add_mock_route':
          return await this.handleAddMockRoute(args);
        case 'start_mock_server':
          return await this.handleStartMockServer(args);
        case 'stop_mock_server':
          return await this.handleStopMockServer(args);
        case 'list_mock_servers':
          return this.handleListMockServers();

        // API Client Tools
        case 'make_http_request':
          return await this.handleMakeHttpRequest(args);
        case 'create_collection':
          return this.handleCreateCollection(args);
        case 'add_request_to_collection':
          return this.handleAddRequestToCollection(args);
        case 'execute_collection_request':
          return await this.handleExecuteCollectionRequest(args);
        case 'list_collections':
          return this.handleListCollections();
        case 'set_collection_variable':
          return this.handleSetCollectionVariable(args);

        // OpenAPI Tools
        case 'parse_openapi_spec':
          return await this.handleParseOpenAPISpec(args);
        case 'list_api_endpoints':
          return this.handleListAPIEndpoints(args);
        case 'get_endpoint_details':
          return this.handleGetEndpointDetails(args);
        case 'get_api_schemas':
          return this.handleGetAPISchemas(args);

        default:
          return {
            content: [
              {
                type: 'text',
                text: `Unknown tool: ${toolName}`,
              },
            ],
            isError: true,
          };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  // Mock Server Handlers

  private async handleCreateMockServer(args: Record<string, unknown>): Promise<MCPResponse> {
    const result = await this.mockServer.createServer({
      port: args.port as number,
      name: args.name as string,
    });

    const data = result.data as { id?: string; name?: string; baseUrl?: string } | undefined;

    return {
      content: [
        {
          type: 'text',
          text: result.success
            ? `## ✅ ${result.message}\n\n**ID:** ${data?.id}\n**Name:** ${data?.name}\n**Base URL:** ${data?.baseUrl}`
            : `## ❌ ${result.message}\n\n${result.error}`,
        },
      ],
      isError: !result.success,
    };
  }

  private async handleAddMockRoute(args: Record<string, unknown>): Promise<MCPResponse> {
    const result = await this.mockServer.addRoute(args.serverId as string, {
      method: args.method as HTTPMethod,
      path: args.path as string,
      response: {
        status: (args.status as number) || 200,
        body: args.body || { success: true },
        delay: args.delay as number,
      },
      description: args.description as string,
    });

    const data = result.data as { routeId?: string; path?: string; method?: string } | undefined;

    return {
      content: [
        {
          type: 'text',
          text: result.success
            ? `## ✅ ${result.message}\n\n**Route ID:** ${data?.routeId}\n**Method:** ${data?.method}\n**Path:** ${data?.path}`
            : `## ❌ ${result.message}\n\n${result.error}`,
        },
      ],
      isError: !result.success,
    };
  }

  private async handleStartMockServer(args: Record<string, unknown>): Promise<MCPResponse> {
    const result = await this.mockServer.startServer(args.serverId as string);
    const data = result.data as
      | { baseUrl?: string; port?: number; routes?: number }
      | undefined;

    return {
      content: [
        {
          type: 'text',
          text: result.success
            ? `## 🚀 ${result.message}\n\n**URL:** ${data?.baseUrl}\n**Port:** ${data?.port}\n**Routes:** ${data?.routes}`
            : `## ❌ ${result.message}\n\n${result.error}`,
        },
      ],
      isError: !result.success,
    };
  }

  private async handleStopMockServer(args: Record<string, unknown>): Promise<MCPResponse> {
    const result = await this.mockServer.stopServer(args.serverId as string);

    return {
      content: [
        {
          type: 'text',
          text: result.success
            ? `## ⏹️ ${result.message}`
            : `## ❌ ${result.message}\n\n${result.error}`,
        },
      ],
      isError: !result.success,
    };
  }

  private handleListMockServers(): MCPResponse {
    const servers = this.mockServer.listServers();

    if (servers.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '## 📋 No Mock Servers\n\nCreate one with `create_mock_server`',
          },
        ],
      };
    }

    const serverList = servers
      .map(
        (s) =>
          `### ${s.name}\n**ID:** ${s.id}\n**URL:** ${s.baseUrl}\n**Status:** ${s.running ? '🟢 Running' : '🔴 Stopped'}\n**Routes:** ${s.routes.length}`
      )
      .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `## 📋 Mock Servers (${servers.length})\n\n${serverList}`,
        },
      ],
    };
  }

  // API Client Handlers

  private async handleMakeHttpRequest(args: Record<string, unknown>): Promise<MCPResponse> {
    const request: HTTPRequest = {
      method: args.method as HTTPMethod,
      url: args.url as string,
      headers: args.headers as Record<string, string>,
      body: args.body,
      query: args.query as Record<string, string>,
    };

    const response = await this.apiClient.makeRequest(request);

    const bodyPreview =
      typeof response.body === 'string'
        ? response.body.substring(0, 500)
        : JSON.stringify(response.body, null, 2).substring(0, 500);

    return {
      content: [
        {
          type: 'text',
          text: `## 📡 HTTP Response\n\n**Status:** ${response.status} ${response.statusText}\n**Duration:** ${response.duration}ms\n\n### Body\n\`\`\`json\n${bodyPreview}${bodyPreview.length >= 500 ? '...' : ''}\n\`\`\``,
        },
      ],
    };
  }

  private handleCreateCollection(args: Record<string, unknown>): MCPResponse {
    const result = this.apiClient.createCollection(
      args.name as string,
      args.description as string,
      args.baseUrl as string
    );

    const data = result.data as { id?: string; name?: string } | undefined;

    return {
      content: [
        {
          type: 'text',
          text: result.success
            ? `## ✅ ${result.message}\n\n**ID:** ${data?.id}\n**Name:** ${data?.name}`
            : `## ❌ ${result.message}\n\n${result.error}`,
        },
      ],
      isError: !result.success,
    };
  }

  private handleAddRequestToCollection(args: Record<string, unknown>): MCPResponse {
    const result = this.apiClient.addRequestToCollection(args.collectionId as string, {
      name: args.name as string,
      method: args.method as HTTPMethod,
      url: args.url as string,
      headers: args.headers as Record<string, string>,
      body: args.body,
      description: args.description as string,
    });

    const data = result.data as { requestId?: string; name?: string } | undefined;

    return {
      content: [
        {
          type: 'text',
          text: result.success
            ? `## ✅ ${result.message}\n\n**Request ID:** ${data?.requestId}\n**Name:** ${data?.name}`
            : `## ❌ ${result.message}\n\n${result.error}`,
        },
      ],
      isError: !result.success,
    };
  }

  private async handleExecuteCollectionRequest(
    args: Record<string, unknown>
  ): Promise<MCPResponse> {
    const response = await this.apiClient.executeCollectionRequest(
      args.collectionId as string,
      args.requestId as string
    );

    const bodyPreview =
      typeof response.body === 'string'
        ? response.body.substring(0, 500)
        : JSON.stringify(response.body, null, 2).substring(0, 500);

    return {
      content: [
        {
          type: 'text',
          text: `## 📡 HTTP Response\n\n**Status:** ${response.status} ${response.statusText}\n**Duration:** ${response.duration}ms\n\n### Body\n\`\`\`json\n${bodyPreview}${bodyPreview.length >= 500 ? '...' : ''}\n\`\`\``,
        },
      ],
    };
  }

  private handleListCollections(): MCPResponse {
    const collections = this.apiClient.listCollections();

    if (collections.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '## 📚 No Collections\n\nCreate one with `create_collection`',
          },
        ],
      };
    }

    const collectionList = collections
      .map(
        (c) =>
          `### ${c.name}\n**ID:** ${c.id}\n**Base URL:** ${c.baseUrl || 'None'}\n**Requests:** ${c.requests.length}\n**Description:** ${c.description || 'N/A'}`
      )
      .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `## 📚 API Collections (${collections.length})\n\n${collectionList}`,
        },
      ],
    };
  }

  private handleSetCollectionVariable(args: Record<string, unknown>): MCPResponse {
    const result = this.apiClient.setCollectionVariable(
      args.collectionId as string,
      args.key as string,
      args.value as string
    );

    const data = result.data as { key?: string; value?: string } | undefined;

    return {
      content: [
        {
          type: 'text',
          text: result.success
            ? `## ✅ ${result.message}\n\n**Variable:** {{${data?.key}}}\n**Value:** ${data?.value}`
            : `## ❌ ${result.message}\n\n${result.error}`,
        },
      ],
      isError: !result.success,
    };
  }

  // OpenAPI Handlers

  private async handleParseOpenAPISpec(args: Record<string, unknown>): Promise<MCPResponse> {
    const result = await this.openApiParser.parseSpec(args.source as string);
    const data = result.data as
      | { id?: string; title?: string; version?: string; endpoints?: number }
      | undefined;

    return {
      content: [
        {
          type: 'text',
          text: result.success
            ? `## ✅ ${result.message}\n\n**ID:** ${data?.id}\n**Title:** ${data?.title}\n**Version:** ${data?.version}\n**Endpoints:** ${data?.endpoints}`
            : `## ❌ ${result.message}\n\n${result.error}`,
        },
      ],
      isError: !result.success,
    };
  }

  private handleListAPIEndpoints(args: Record<string, unknown>): MCPResponse {
    const result = this.openApiParser.listEndpoints(args.specId as string);

    if (!result.success) {
      return {
        content: [
          {
            type: 'text',
            text: `## ❌ ${result.message}\n\n${result.error}`,
          },
        ],
        isError: true,
      };
    }

    const data = result.data as {
      total?: number;
      endpoints?: Array<{ method?: string; path?: string; summary?: string }>;
    };

    const endpointList = (data.endpoints || [])
      .map((e) => `- **${e.method}** ${e.path} - ${e.summary || 'No description'}`)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `## 🔗 API Endpoints (${data.total})\n\n${endpointList}`,
        },
      ],
    };
  }

  private handleGetEndpointDetails(args: Record<string, unknown>): MCPResponse {
    const result = this.openApiParser.getEndpointDetails(
      args.specId as string,
      args.method as string,
      args.path as string
    );

    if (!result.success) {
      return {
        content: [
          {
            type: 'text',
            text: `## ❌ ${result.message}\n\n${result.error}`,
          },
        ],
        isError: true,
      };
    }

    const details = JSON.stringify(result.data, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `## 🔍 Endpoint Details\n\n\`\`\`json\n${details}\n\`\`\``,
        },
      ],
    };
  }

  private handleGetAPISchemas(args: Record<string, unknown>): MCPResponse {
    const result = this.openApiParser.getSchemas(args.specId as string);

    if (!result.success) {
      return {
        content: [
          {
            type: 'text',
            text: `## ❌ ${result.message}\n\n${result.error}`,
          },
        ],
        isError: true,
      };
    }

    const data = result.data as { total?: number; schemas?: string[] };
    const schemaList = (data.schemas || []).map((s) => `- **${s}**`).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `## 📄 API Schemas (${data.total})\n\n${schemaList}`,
        },
      ],
    };
  }

  /**
   * Run the MCP server
   */
  async run(): Promise<void> {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    readline.on('line', async (line: string) => {
      try {
        const request: MCPRequest = JSON.parse(line);

        let response;
        if (request.method === 'tools/list') {
          response = { tools: this.listTools() };
        } else if (request.method === 'tools/call') {
          response = await this.callTool(request);
        } else {
          response = {
            error: {
              code: -32601,
              message: 'Method not found',
            },
          };
        }

        console.log(JSON.stringify(response));
      } catch (error) {
        console.error('Server error:', error);
      }
    });
  }
}
