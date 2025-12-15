#!/usr/bin/env node

/**
 * Master Claude MCP Server
 * Intelligent AI orchestrator that routes queries to the best local AI CLI
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { detectModels, getAuthenticatedModels } from './detector.js';
import { selectBestModel, selectConsensusModels } from './router.js';
import { executeQuery, executeConsensus } from './executor.js';
import { loadConfig } from './config.js';
import type { AIModel, QueryRequest } from './types.js';

// Cache models and config
let cachedModels: AIModel[] | null = null;
let configCache = await loadConfig();

/**
 * Get models (with caching)
 */
async function getModels(): Promise<AIModel[]> {
  if (!cachedModels) {
    cachedModels = await detectModels();
  }
  return cachedModels;
}

/**
 * Refresh model cache
 */
async function refreshModels(): Promise<AIModel[]> {
  cachedModels = await detectModels();
  return cachedModels;
}

/**
 * Create MCP server
 */
const server = new Server(
  {
    name: 'master-claude',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_models',
        description:
          'List all detected AI CLI models with their availability, authentication status, and capabilities',
        inputSchema: {
          type: 'object',
          properties: {
            authenticated_only: {
              type: 'boolean',
              description: 'Only show authenticated models (default: false)',
            },
            refresh: {
              type: 'boolean',
              description: 'Refresh model detection cache (default: false)',
            },
          },
        },
      },
      {
        name: 'ask_model',
        description: 'Ask a specific AI model a question',
        inputSchema: {
          type: 'object',
          properties: {
            provider: {
              type: 'string',
              description: 'Provider name (gemini, openai, deepseek, claude, etc.)',
            },
            query: {
              type: 'string',
              description: 'The question or prompt to send',
            },
            context: {
              type: 'string',
              description: 'Optional context or background information',
            },
          },
          required: ['provider', 'query'],
        },
      },
      {
        name: 'ask_best',
        description:
          'Automatically route query to the best AI model based on routing rules and optimization settings',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The question or prompt to send',
            },
            context: {
              type: 'string',
              description: 'Optional context or background information',
            },
            prefer_provider: {
              type: 'string',
              description: 'Preferred provider if available (optional)',
            },
            require_capabilities: {
              type: 'array',
              items: { type: 'string' },
              description: 'Required capabilities (e.g., ["code", "vision"])',
            },
            max_cost: {
              type: 'number',
              description: 'Maximum cost per million tokens',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'consensus',
        description:
          'Ask multiple AI models the same question and find consensus among responses',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The question or prompt to send',
            },
            context: {
              type: 'string',
              description: 'Optional context or background information',
            },
            min_models: {
              type: 'number',
              description: 'Minimum number of models to query (default: 3)',
            },
            max_models: {
              type: 'number',
              description: 'Maximum number of models to query (default: 5)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'compare_models',
        description: 'Compare responses from specific AI models side-by-side',
        inputSchema: {
          type: 'object',
          properties: {
            providers: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of provider names to compare (e.g., ["gemini", "claude"])',
            },
            query: {
              type: 'string',
              description: 'The question or prompt to send',
            },
            context: {
              type: 'string',
              description: 'Optional context or background information',
            },
          },
          required: ['providers', 'query'],
        },
      },
      {
        name: 'get_config',
        description: 'Get current Master Claude configuration including routing rules',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'update_config',
        description: 'Update Master Claude configuration',
        inputSchema: {
          type: 'object',
          properties: {
            config: {
              type: 'object',
              description: 'New configuration object',
            },
          },
          required: ['config'],
        },
      },
    ],
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_models': {
        const refresh = args?.refresh === true;
        if (refresh) {
          await refreshModels();
        }

        const models = await getModels();
        const filtered = args?.authenticated_only
          ? models.filter(m => m.available && m.authenticated)
          : models;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(filtered, null, 2),
            },
          ],
        };
      }

      case 'ask_model': {
        const provider = args?.provider as string;
        const query = args?.query as string;
        const context = args?.context as string | undefined;

        const models = await getModels();
        const model = models.find(
          m => m.provider === provider && m.available && m.authenticated
        );

        if (!model) {
          throw new Error(
            `Model '${provider}' not found or not authenticated. Run 'list_models' to see available models.`
          );
        }

        const response = await executeQuery(model, query, context);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case 'ask_best': {
        const queryReq: QueryRequest = {
          query: args?.query as string,
          context: args?.context as string | undefined,
          preferProvider: args?.prefer_provider as string | undefined,
          requireCapabilities: args?.require_capabilities as any[] | undefined,
          maxCost: args?.max_cost as number | undefined,
        };

        const models = await getAuthenticatedModels();
        const selectedModel = selectBestModel(models, queryReq, configCache);

        if (!selectedModel) {
          throw new Error(
            'No suitable model found for this query. Check your routing rules and model availability.'
          );
        }

        const response = await executeQuery(selectedModel, queryReq.query, queryReq.context);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  selected_model: selectedModel.name,
                  ...response,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'consensus': {
        const query = args?.query as string;
        const context = args?.context as string | undefined;
        const minModels = (args?.min_models as number) || configCache.consensusMinModels;
        const maxModels = (args?.max_models as number) || configCache.consensusMaxModels;

        const models = await getAuthenticatedModels();

        const tempConfig = { ...configCache, consensusMinModels: minModels, consensusMaxModels: maxModels };
        const selectedModels = selectConsensusModels(models, { query }, tempConfig);

        if (selectedModels.length === 0) {
          throw new Error('No models available for consensus query');
        }

        const result = await executeConsensus(selectedModels, query, context);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'compare_models': {
        const providers = args?.providers as string[];
        const query = args?.query as string;
        const context = args?.context as string | undefined;

        if (!providers || providers.length === 0) {
          throw new Error('At least one provider must be specified');
        }

        const models = await getModels();
        const selectedModels = providers
          .map(p => models.find(m => m.provider === p && m.available && m.authenticated))
          .filter((m): m is AIModel => m !== undefined);

        if (selectedModels.length === 0) {
          throw new Error('None of the specified providers are available or authenticated');
        }

        const result = await executeConsensus(selectedModels, query, context);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_config': {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(configCache, null, 2),
            },
          ],
        };
      }

      case 'update_config': {
        const newConfig = args?.config as any;
        configCache = { ...configCache, ...newConfig };
        await import('./config.js').then(m => m.saveConfig(configCache));

        return {
          content: [
            {
              type: 'text',
              text: 'Configuration updated successfully',
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is reserved for MCP protocol)
  console.error('Master Claude MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
