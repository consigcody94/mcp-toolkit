#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import dotenv from 'dotenv';

// Core
import { config, getEnabledPlatforms } from './core/config.js';
import { logger } from './core/logger.js';
import { scheduler } from './core/scheduler.js';
import { rateLimiter } from './core/rate-limiter.js';

// Platform tools
import { twitterTools } from './platforms/twitter/tools.js';
import { linkedinTools } from './platforms/linkedin/tools.js';
import { metaTools } from './platforms/meta/tools.js';
import { tiktokTools } from './platforms/tiktok/tools.js';
import { youtubeTools } from './platforms/youtube/tools.js';

// Cross-platform tools
import { crossPlatformTools } from './services/cross-platform.js';

dotenv.config();

const log = logger.child({ tool: 'server' });

// Collect all tools
const allTools = [
  ...crossPlatformTools,
  ...twitterTools,
  ...linkedinTools,
  ...metaTools,
  ...tiktokTools,
  ...youtubeTools,
];

// Create tool registry
const toolRegistry = new Map<string, { schema: any; handler: Function }>();
for (const tool of allTools) {
  toolRegistry.set(tool.name, { schema: tool.schema, handler: tool.handler });
}

// Initialize server
const server = new Server(
  {
    name: 'social-media-mcp',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = allTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: zodToJsonSchema(tool.schema as any),
  }));

  log.debug(`Listing ${tools.length} tools`);

  return { tools };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  log.info(`Calling tool: ${name}`, { tool: name });

  const tool = toolRegistry.get(name);

  if (!tool) {
    log.error(`Tool not found: ${name}`);
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Tool not found: ${name}. Available tools: ${Array.from(toolRegistry.keys()).join(', ')}`,
        },
      ],
    };
  }

  try {
    // Validate arguments
    const validatedArgs = tool.schema.parse(args || {});

    // Execute handler
    const result = await tool.handler(validatedArgs);

    log.debug(`Tool ${name} completed successfully`);

    return result;
  } catch (error: any) {
    log.error(`Tool ${name} failed: ${error.message}`, { tool: name }, error);

    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Invalid arguments for ${name}: ${error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
          },
        ],
      };
    }

    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error executing tool ${name}: ${error.message}`,
        },
      ],
    };
  }
});

// List resources handler
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'social://accounts/status',
        name: 'Connected Accounts',
        description: 'Status of all connected social media accounts',
        mimeType: 'text/plain',
      },
      {
        uri: 'social://analytics/summary',
        name: 'Analytics Summary',
        description: 'Aggregated analytics from all platforms',
        mimeType: 'text/plain',
      },
      {
        uri: 'social://schedule/pending',
        name: 'Pending Posts',
        description: 'List of scheduled posts waiting to be published',
        mimeType: 'application/json',
      },
      {
        uri: 'social://rate-limits',
        name: 'Rate Limits',
        description: 'Current rate limit status for all platforms',
        mimeType: 'application/json',
      },
    ],
  };
});

// Read resource handler
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  log.debug(`Reading resource: ${uri}`);

  switch (uri) {
    case 'social://accounts/status': {
      const enabledPlatforms = getEnabledPlatforms();
      const allPlatforms = ['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube'];

      let content = 'Connected Social Media Accounts\n';
      content += '=' .repeat(40) + '\n\n';

      for (const platform of allPlatforms) {
        const status = enabledPlatforms.includes(platform) ? '✓ Connected' : '✗ Not configured';
        content += `${platform.toUpperCase().padEnd(12)} ${status}\n`;
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text: content,
          },
        ],
      };
    }

    case 'social://analytics/summary': {
      // Get analytics from cross-platform service
      const { getAllAnalytics } = await import('./services/cross-platform.js');

      const result = await getAllAnalytics({});
      return {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text: result.content[0].text,
          },
        ],
      };
    }

    case 'social://schedule/pending': {
      const posts = scheduler.getPosts({ status: 'pending' });
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(posts, null, 2),
          },
        ],
      };
    }

    case 'social://rate-limits': {
      const limits = rateLimiter.getAllStatuses();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(limits, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

// Main entry point
async function main() {
  log.info('Starting Social Media MCP Server v2.0.0');

  // Log enabled platforms
  const enabledPlatforms = getEnabledPlatforms();
  if (enabledPlatforms.length > 0) {
    log.info(`Enabled platforms: ${enabledPlatforms.join(', ')}`);
  } else {
    log.warn('No platforms configured. Set API tokens in .env file.');
  }

  // Start scheduler
  scheduler.start(60000); // Check every minute

  // Connect to transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  log.info('Server connected and ready');

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log.info('Shutting down...');
    scheduler.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    log.info('Shutting down...');
    scheduler.stop();
    process.exit(0);
  });
}

main().catch((error) => {
  log.error('Fatal error', {}, error);
  process.exit(1);
});
