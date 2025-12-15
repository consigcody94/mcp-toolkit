/**
 * API Pilot - MCP Server for API Mocking and Exploration
 */

import { APIPilotMCPServer } from './mcp-server.js';

export { MockAPIServer } from './mock-server.js';
export { APIClient } from './api-client.js';
export { OpenAPIParser } from './openapi-parser.js';
export { APIPilotMCPServer } from './mcp-server.js';

export type {
  HTTPMethod,
  HTTPHeaders,
  HTTPRequest,
  HTTPResponse,
  MockRoute,
  MockServer,
  MockServerConfig,
  APIRequest,
  APICollection,
  OpenAPIInfo,
  OpenAPIServer,
  OpenAPIPath,
  OpenAPISpec,
  RecordedRequest,
  RequestRecording,
  MCPRequest,
  MCPResponse,
  MCPTool,
  OperationResult,
} from './types.js';

// CLI entry point for MCP server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new APIPilotMCPServer();
  server.run().catch((error: Error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
