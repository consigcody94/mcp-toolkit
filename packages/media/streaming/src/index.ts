/**
 * Stream Pilot - MCP Server for OBS Studio and Twitch
 */

import { StreamPilotMCPServer } from './mcp-server.js';

export { OBSClient } from './obs-client.js';
export { TwitchClient } from './twitch-client.js';
export { StreamPilotMCPServer } from './mcp-server.js';

export type {
  OBSConfig,
  OBSScene,
  OBSSource,
  OBSStreamStatus,
  OBSRecordStatus,
  OBSStats,
  TwitchConfig,
  TwitchUser,
  TwitchStream,
  TwitchChannel,
  TwitchClip,
  MCPRequest,
  MCPResponse,
  MCPTool,
  OperationResult,
} from './types.js';

// CLI entry point for MCP server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new StreamPilotMCPServer();
  server.run().catch((error: Error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
